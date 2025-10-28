import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  userId: string;
  userName: string;
  votes: { [pollId: string]: string };
  likes: string[];
}

const initialState: UserState = {
  userId: '',
  userName: '',
  votes: {},
  likes: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    setUserName: (state, action: PayloadAction<string>) => {
      state.userName = action.payload;
    },
    setUserVotes: (state, action: PayloadAction<{ [pollId: string]: string }>) => {
      state.votes = action.payload;
    },
    addUserVote: (state, action: PayloadAction<{ pollId: string; optionId: string }>) => {
      state.votes[action.payload.pollId] = action.payload.optionId;
    },
    setUserLikes: (state, action: PayloadAction<string[]>) => {
      state.likes = action.payload;
    },
    toggleUserLike: (state, action: PayloadAction<string>) => {
      const pollId = action.payload;
      const index = state.likes.indexOf(pollId);
      if (index > -1) {
        state.likes.splice(index, 1);
      } else {
        state.likes.push(pollId);
      }
    },
  },
});

export const {
  setUserId,
  setUserName,
  setUserVotes,
  addUserVote,
  setUserLikes,
  toggleUserLike
} = userSlice.actions;
export default userSlice.reducer;