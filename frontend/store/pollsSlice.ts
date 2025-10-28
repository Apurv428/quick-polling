import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  createdBy: string;
  createdAt: string;
  votes: { [key: string]: number };
  likes: number;
  totalVotes: number;
}

interface PollsState {
  polls: Poll[];
  loading: boolean;
  error: string | null;
}

const initialState: PollsState = {
  polls: [],
  loading: false,
  error: null,
};

const pollsSlice = createSlice({
  name: 'polls',
  initialState,
  reducers: {
    setPolls: (state, action: PayloadAction<Poll[]>) => {
      state.polls = action.payload;
    },
    addPoll: (state, action: PayloadAction<Poll>) => {
      state.polls.unshift(action.payload);
    },
    updatePoll: (state, action: PayloadAction<Poll>) => {
      const index = state.polls.findIndex(poll => poll.id === action.payload.id);
      if (index !== -1) {
        state.polls[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setPolls, addPoll, updatePoll, setLoading, setError } = pollsSlice.actions;
export default pollsSlice.reducer;