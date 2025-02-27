import { combineReducers } from "redux";
import persistReducer from "redux-persist/es/persistReducer";
import storage from "redux-persist/lib/storage";
import AuthReducer from "./Auth";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["userReducer", "AuthReducer"],
};

const reducers = combineReducers({
  AuthReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === "LOGOUT") {
    storage.removeItem("persist:root");
    return reducers(undefined, action);
  }
  return reducers(state, action);
};

export default persistReducer(persistConfig, rootReducer);
