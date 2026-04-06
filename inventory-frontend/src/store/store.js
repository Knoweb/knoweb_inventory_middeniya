import { configureStore } from '@reduxjs/toolkit';
import stockReducer from './stockSlice';

const store = configureStore({
    reducer: {
        stock: stockReducer,
    },
});

export default store;
