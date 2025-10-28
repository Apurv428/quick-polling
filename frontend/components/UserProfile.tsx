// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { User, Edit2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_BASE_URL } from "@/lib/config";

interface Profile {
  userId: string;
  username: string;
  avatar?: string;
  bio?: string;
  pollsCreated: number;
  totalVotes: number;
}

interface UserProfileProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function UserProfile({ userId, isOwnProfile = false }: UserProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    avatar: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`);
      const data = await response.json();
      setProfile(data);
      setEditForm({
        username: data.username || "",
        avatar: data.avatar || "",
        bio: data.bio || "",
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username: editForm.username,
          avatar: editForm.avatar,
          bio: editForm.bio,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const data = await response.json();
      setProfile(data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Profile not found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          {isOwnProfile && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={saveProfile}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Username</label>
              <Input
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Enter username"
                maxLength={50}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Avatar URL</label>
              <Input
                value={editForm.avatar}
                onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                maxLength={200}
                rows={3}
              />
              <span className="text-xs text-muted-foreground">
                {editForm.bio.length}/200
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar} alt={profile.username} />
                <AvatarFallback>
                  {profile.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h3 className="font-semibold text-lg">{profile.username}</h3>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{profile.pollsCreated}</div>
                <div className="text-xs text-muted-foreground">Polls Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{profile.totalVotes}</div>
                <div className="text-xs text-muted-foreground">Total Votes</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}