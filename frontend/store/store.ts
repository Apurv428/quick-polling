import { configureStore } from '@reduxjs/toolkit';
import pollsReducer from './pollsSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    polls: pollsReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
