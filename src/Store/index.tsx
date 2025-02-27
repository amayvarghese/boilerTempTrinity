import { configureStore } from "@reduxjs/toolkit";
import persistStore from "redux-persist/es/persistStore";
import thunk from "redux-thunk";
import customPersistReducer from "./Reducers";

export const store = configureStore({
  reducer: customPersistReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: [thunk],
});

export const persistor = persistStore(store);
