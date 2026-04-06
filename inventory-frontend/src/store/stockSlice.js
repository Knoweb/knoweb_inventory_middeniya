import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// ─── Mock current stock data (replace with real API call when ready) ───────────
const MOCK_STOCK = {
  // key: `${productId}_${warehouseId}` → available quantity
  '1_1': 150,
  '1_2': 80,
  '2_1': 200,
  '2_2': 45,
  '3_1': 0,
};

/**
 * Async thunk: Submit a stock transaction to the Inventory Service.
 * Calls POST /api/inventory/transactions
 */
export const submitStockTransaction = createAsyncThunk(
  'stock/submitTransaction',
  async (transactionPayload, { rejectWithValue }) => {
    try {
      // Attach orgId from the logged-in user so the backend can set it on new Stock records
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const enrichedPayload = {
        ...transactionPayload,
        orgId: transactionPayload.orgId ?? user.orgId ?? null,
        transactionDate: transactionPayload.transactionDate ?? new Date().toISOString(),
      };
      const response = await apiClient.post('/api/inventory/transactions', enrichedPayload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to submit transaction'
      );
    }
  }
);

/**
 * Async thunk: Fetch current stock for a product/warehouse combination.
 * Used for real-time stock validation.
 */
export const fetchCurrentStock = createAsyncThunk(
  'stock/fetchCurrentStock',
  async ({ productId, warehouseId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/api/inventory/stocks/product/${productId}`
      );
      // Find the specific warehouse stock from the list
      const stocks = response.data;
      const warehouseStock = stocks.find(
        (s) => s.warehouseId === Number(warehouseId)
      );
      return {
        productId,
        warehouseId,
        availableQuantity: warehouseStock?.availableQuantity ?? 0,
      };
    } catch (error) {
      // Fallback to mock data if API fails
      const mockKey = `${productId}_${warehouseId}`;
      return {
        productId,
        warehouseId,
        availableQuantity: MOCK_STOCK[mockKey] ?? 0,
      };
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────
const stockSlice = createSlice({
  name: 'stock',
  initialState: {
    // Submission state
    submitting: false,
    submitSuccess: false,
    submitError: null,
    lastTransaction: null,

    // Current stock lookup state
    currentStock: null,       // { productId, warehouseId, availableQuantity }
    stockLoading: false,
    stockError: null,
  },
  reducers: {
    resetTransactionState(state) {
      state.submitting = false;
      state.submitSuccess = false;
      state.submitError = null;
      state.lastTransaction = null;
    },
    clearCurrentStock(state) {
      state.currentStock = null;
      state.stockError = null;
    },
  },
  extraReducers: (builder) => {
    // ── submitStockTransaction ──
    builder
      .addCase(submitStockTransaction.pending, (state) => {
        state.submitting = true;
        state.submitSuccess = false;
        state.submitError = null;
      })
      .addCase(submitStockTransaction.fulfilled, (state, action) => {
        state.submitting = false;
        state.submitSuccess = true;
        state.lastTransaction = action.payload;
      })
      .addCase(submitStockTransaction.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      });

    // ── fetchCurrentStock ──
    builder
      .addCase(fetchCurrentStock.pending, (state) => {
        state.stockLoading = true;
        state.stockError = null;
      })
      .addCase(fetchCurrentStock.fulfilled, (state, action) => {
        state.stockLoading = false;
        state.currentStock = action.payload;
      })
      .addCase(fetchCurrentStock.rejected, (state, action) => {
        state.stockLoading = false;
        state.stockError = action.payload;
      });
  },
});

export const { resetTransactionState, clearCurrentStock } = stockSlice.actions;
export default stockSlice.reducer;
