// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Heart, TrendingUp, QrCode, Download, Code } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AnimatedVoteBar from '@/components/AnimatedVoteBar';
import { PollListSkeleton } from '@/components/PollSkeleton';
import PresenceIndicator from '@/components/PresenceIndicator';
import EmptyPollsState from '@/components/EmptyPollsState';
import { retryWithDelay, showErrorToast, showSuccessToast, getErrorMessage } from '@/lib/errorHandler';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setPolls, addPoll, updatePoll, setLoading } from '@/store/pollsSlice';
import { setUserId, setUserName, setUserVotes, addUserVote, setUserLikes, toggleUserLike } from '@/store/userSlice';
import { API_BASE_URL, WS_BASE_URL } from '@/lib/config';
import { Console } from 'console';

const Home = (props) => {
  const dispatch = useAppDispatch();
  const polls = useAppSelector((state) => state.polls.polls);
  const isLoading = useAppSelector((state) => state.polls.loading);
  const { userId, userName, votes: userVotes, likes: userLikes } = useAppSelector((state) => state.user);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [ws, setWs] = useState(null);
  const [currentViewingPoll, setCurrentViewingPoll] = useState(null);
  const [pollViewers, setPollViewers] = useState({});
  const [optimisticVotes, setOptimisticVotes] = useState({});
  const wsRef = useRef(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [qrCodeDialog, setQrCodeDialog] = useState({ open: false, pollId: null, qrCodeUrl: null });
  const [embedDialog, setEmbedDialog] = useState({ open: false, pollId: null, embedCode: '' });

  useEffect(() => {
    let storedUserId = localStorage.getItem('userId');
    let storedUserName = localStorage.getItem('userName');

    if (!storedUserId) {
      storedUserId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', storedUserId);
    }

    if (!storedUserName) {
      storedUserName = `User${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem('userName', storedUserName);
    }

    dispatch(setUserId(storedUserId));
    dispatch(setUserName(storedUserName));
  }, [dispatch]);

  useEffect(() => {
    if (!userId) return;

    dispatch(setLoading(true));
    fetchPolls().finally(() => dispatch(setLoading(false)));
    fetchUserVotes();
    fetchUserLikes();

    const pollInterval = setInterval(() => {
      fetchPolls();
      fetchUserVotes();
      fetchUserLikes();
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [userId]);

  const fetchPolls = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/polls`);
      if (!response.ok) throw new Error('Failed to fetch polls');
      const data = await response.json();
      dispatch(setPolls(data));
    } catch (error) {
      console.error('Error fetching polls:', error);
      showErrorToast('Couldn\'t load polls. Please refresh the page.');
    }
  };

  const fetchUserVotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/votes`);
      const data = await response.json();
      dispatch(setUserVotes(typeof data === 'object' && data !== null && !Array.isArray(data) ? data : {}));
    } catch (error) {
      console.error('Error fetching user votes:', error);
      dispatch(setUserVotes({}));
    }
  };

  const fetchUserLikes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/likes`);
      const data = await response.json();
      dispatch(setUserLikes(Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Error fetching user likes:', error);
      dispatch(setUserLikes([]));
    }
  };

  const createPoll = async () => {
    if (!newPollTitle.trim() || newPollOptions.filter((o) => o.trim()).length < 2) {
      showErrorToast('Please provide a title and at least 2 options');
      return;
    }

    setIsCreatingPoll(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newPollTitle,
          options: newPollOptions.filter((o) => o.trim()),
          creator_id: userId,
        }),
      });

      if (response.ok) {
        const newPoll = await response.json();
        showSuccessToast('Poll created successfully! 🎉');
        setNewPollTitle('');
        setNewPollOptions(['', '']);
        setIsCreateDialogOpen(false);

        await fetchPolls();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showErrorToast(errorData.detail || 'Failed to create poll. Please try again.');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      showErrorToast('Network error. Please check your connection and try again.');
    } finally {
      setIsCreatingPoll(false);
    }
  }

  const generatePollWithAI = async () => {
    if (!aiPrompt.trim()) {
      showErrorToast('Please enter a prompt for AI to generate a poll');
      return;
    }

    try {
      setIsGeneratingAI(true);
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiPrompt }),
      });

      if (response.ok) {
        const generatedPoll = await response.json();

        if (!generatedPoll || typeof generatedPoll !== 'object') {
          throw new Error('Invalid response from AI service');
        }

        if (generatedPoll.detail || generatedPoll.type) {
          const errorMsg = generatedPoll.detail || 'AI service returned an error';
          showErrorToast(typeof errorMsg === 'string' ? errorMsg : 'Failed to generate poll');
          return;
        }

        const question = generatedPoll.question || generatedPoll.title || '';
        const options = Array.isArray(generatedPoll.options)
          ? generatedPoll.options
          : ['', ''];

        if (!question || options.length < 2) {
          showErrorToast('AI generated incomplete poll data. Please try again.');
          return;
        }

        setNewPollTitle(question);
        setNewPollOptions(options);
        setAiPrompt('');
        showSuccessToast('Poll generated by AI! ✨ Edit and create when ready.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.detail || errorData.message || 'Failed to generate poll with AI';
        showErrorToast(typeof errorMsg === 'string' ? errorMsg : 'Failed to generate poll with AI');
      }
    } catch (error) {
      console.error('Error generating poll with AI:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect to AI service';
      showErrorToast(errorMsg);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const showQRCode = async (pollId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/polls/${pollId}/qr`);
      if (response.ok) {
        const data = await response.json();
        const qrCodeUrl = data.qr_code_url;
        setQrCodeDialog({ open: true, pollId, qrCodeUrl });

      } else {
        showErrorToast('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      showErrorToast('Failed to fetch QR code');
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDialog.qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeDialog.qrCodeUrl;
      link.download = `poll-${qrCodeDialog.pollId}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccessToast('QR code downloaded! 📥');
    }
  };

  const exportToCSV = async (pollId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/polls/${pollId}/export/csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `poll-${pollId}-results.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showSuccessToast('Poll data exported! 📊');
      } else {
        showErrorToast('Failed to export poll data');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showErrorToast('Failed to export poll data');
    }
  };

  const showEmbedCode = (pollId) => {
    const embedCode = `<iframe src="${window.location.origin}/embed/${pollId}" width="100%" height="500" frameborder="0"></iframe>`;
    setEmbedDialog({ open: true, pollId, embedCode });
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedDialog.embedCode);
    showSuccessToast('Embed code copied! 📋');
  };

  const submitVote = async (pollId, optionId) => {
    const attemptVote = async () => {
      const response = await fetch(`${API_BASE_URL}/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          option_id: optionId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.detail || 'Failed to submit vote');
        error.response = {
          status: response.status,
          data: errorData,
        };
        throw error;
      }

      return response;
    };

    try {
      await retryWithDelay(attemptVote, 0, 2);
      await fetchPolls();

      const tempId = `temp_${Date.now()}`;
      setOptimisticVotes((prev) => ({
        ...prev,
        [pollId]: { optionId, tempId },
      }));

      dispatch(addUserVote({ pollId, optionId }));

      showSuccessToast('Vote submitted successfully!');
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  const toggleLike = async (pollId) => {
    dispatch(toggleUserLike(pollId));

    try {
      const response = await fetch(`${API_BASE_URL}/api/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          userId,
        }),
      });

      if (!response.ok) {
        dispatch(toggleUserLike(pollId));
        showErrorToast('Couldn\'t update like. Please try again.');
      } else {
        await fetchPolls();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      dispatch(toggleUserLike(pollId));
      showErrorToast('Couldn\'t update like. Please try again.');
    }
  };

  const addOption = () => {
    setNewPollOptions([...newPollOptions, '']);
  };

  const updateOption = (index, value) => {
    const updated = [...newPollOptions];
    updated[index] = value;
    setNewPollOptions(updated);
  };

  const removeOption = (index) => {
    if (newPollOptions.length > 2) {
      setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
    }
  };

  const getPercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 1500,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header
          className="mb-8 text-center"
          role="banner"
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
            <TrendingUp className="w-10 h-10 text-blue-600" aria-hidden="true" />
            <span>QuickPoll</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Real-Time Opinion Polling Platform</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Logged in as: <span className="font-semibold">{userName}</span>
          </p>
          <div className="mt-3">
            <a
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white text-sm font-medium rounded-lg shadow hover:from-gray-800 hover:to-gray-900 transition"
            >
              📊 Admin Dashboard
            </a>
          </div>
        </header>

        <div className="mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                size="lg"
                aria-label="Create a new poll"
              >
                <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
                Create New Poll
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-md"
              aria-describedby="create-poll-description"
            >
              <DialogHeader>
                <DialogTitle>Create a New Poll</DialogTitle>
                <DialogDescription id="create-poll-description">
                  Ask a question and provide options for people to vote on.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✨</span>
                    <Label htmlFor="ai-prompt" className="text-purple-700 font-semibold">
                      Generate with AI
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="ai-prompt"
                      placeholder="E.g., Create a poll about favorite programming languages"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          generatePollWithAI();
                        }
                      }}
                      disabled={isGeneratingAI}
                    />
                    <Button
                      onClick={generatePollWithAI}
                      disabled={isGeneratingAI || !aiPrompt.trim()}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isGeneratingAI ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Let AI create a poll for you, then customize as needed
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or create manually</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Poll Question</Label>
                  <Input
                    id="title"
                    placeholder="What's your question?"
                    value={newPollTitle}
                    onChange={(e) => setNewPollTitle(e.target.value)}
                    aria-required="true"
                  />
                </div>
                <div>
                  <Label>Options</Label>
                  {newPollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        aria-label={`Poll option ${index + 1}`}
                        aria-required="true"
                      />
                      {newPollOptions.length > 2 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeOption(index)}
                          aria-label={`Remove option ${index + 1}`}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={addOption}
                    aria-label="Add another option"
                  >
                    + Add Option
                  </Button>
                </div>
              </div>
              <Button
                onClick={createPoll}
                className="w-full"
                disabled={isCreatingPoll}
                aria-label="Submit and create poll"
              >
                {isCreatingPoll ? 'Creating...' : 'Create Poll'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <main role="main" aria-label="Polls list">
          {isLoading ? (
            <PollListSkeleton count={3} />
          ) : (
            <div className="space-y-4">
              {polls.length === 0 ? (
                <EmptyPollsState onCreatePoll={() => setIsCreateDialogOpen(true)} />
              ) : (
                polls.map((poll) => (
                  <Card
                    key={poll.id}
                    className="hover:shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500"
                    role="article"
                    aria-label={`Poll: ${poll.question}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{poll.question}</CardTitle>
                          <p className="text-sm text-gray-500">
                            By {poll.creator_id || 'Anonymous'} • {new Date(poll.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <PresenceIndicator
                          viewerCount={pollViewers[poll.id] || poll.viewers || 0}
                          aria-label={`${pollViewers[poll.id] || poll.viewers || 0} people viewing this poll`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div role="group" aria-label="Poll options">
                        {poll.options.map((option) => {
                          const votes = option.votes || 0;
                          const percentage = getPercentage(votes, poll.total_votes || 0);
                          const isUserVote = userVotes[poll.id] === option.id;
                          const isOptimistic = optimisticVotes[poll.id]?.optionId === option.id;

                          return (
                            <div
                              key={option.id}
                              onClick={() => submitVote(poll.id, option.id)}
                              className="cursor-pointer focus-within:outline-none"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  submitVote(poll.id, option.id);
                                }
                              }}
                              aria-label={`Vote for ${option.text}. Currently ${votes} votes, ${percentage.toFixed(1)} percent`}
                              aria-pressed={isUserVote}
                            >
                              <AnimatedVoteBar
                                option={option.text}
                                percentage={percentage}
                                votes={votes}
                                isSelected={isUserVote || isOptimistic}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center flex-wrap gap-2">
                      <div
                        className="text-sm text-gray-600 dark:text-gray-400"
                        aria-live="polite"
                      >
                        {poll.total_votes || 0} total {(poll.total_votes || 0) === 1 ? 'vote' : 'votes'}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showQRCode(poll.id)}
                          aria-label="Show QR code"
                          title="Show QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToCSV(poll.id)}
                          aria-label="Export to CSV"
                          title="Export CSV"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showEmbedCode(poll.id)}
                          aria-label="Get embed code"
                          title="Embed Code"
                        >
                          <Code className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={userLikes.includes(poll.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleLike(poll.id)}
                          aria-label={userLikes.includes(poll.id) ? `Unlike this poll. Currently ${poll.likes || 0} likes` : `Like this poll. Currently ${poll.likes || 0} likes`}
                          aria-pressed={userLikes.includes(poll.id)}
                        >
                          <Heart
                            className={`w-4 h-4 mr-1 ${userLikes.includes(poll.id) ? 'fill-current' : ''
                              }`}
                            aria-hidden="true"
                          />
                          <span>{poll.likes || 0}</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
        </main>

        <Dialog open={qrCodeDialog.open} onOpenChange={(open) => setQrCodeDialog({ ...qrCodeDialog, open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code</DialogTitle>
              <DialogDescription>
                Scan this QR code to share or access the poll
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              {qrCodeDialog.qrCodeUrl && (
                <img
                  src={qrCodeDialog.qrCodeUrl}
                  alt="Poll QR Code"
                  className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                />
              )}
            </div>
            <Button onClick={downloadQRCode} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog open={embedDialog.open} onOpenChange={(open) => setEmbedDialog({ ...embedDialog, open })}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Embed Poll</DialogTitle>
              <DialogDescription>
                Copy this code to embed the poll on your website
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-lg font-mono text-sm overflow-x-auto">
                <code>{embedDialog.embedCode}</code>
              </div>
              <Button onClick={copyEmbedCode} className="w-full">
                <Code className="w-4 h-4 mr-2" />
                Copy Embed Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Home;