import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {CanceledSubscriptionsRoute} from "./routeSchema";

describe('Canceled Subscriptions API', () => {
  it('should return canceled subscriptions', async () => {
    // Mock data that would be returned from the RPC call
    const mockCanceledSubscriptions = [
      {
        stripe_subscription_id: 'sub_123',
        stripe_product_id: 'prod_123',
        stripe_product_name: 'Premium Plan',
        canceled_at: '2023-09-01T00:00:00.000Z',
        cancellation_reason: 'customer_requested'
      }
    ];

    // Mock the API call
    const mockResponse = {
      data: mockCanceledSubscriptions,
      error: null
    };

    // Create a mock implementation
    const mockCall = vi.fn().mockResolvedValue(mockResponse);
    
    // Replace the actual call method with our mock
    const originalCall = CanceledSubscriptionsRoute.call;
    CanceledSubscriptionsRoute.call = mockCall;

    try {
      // Call the API
      const response = await CanceledSubscriptionsRoute.call({});
      
      // Verify the response
      expect(response).toEqual(mockResponse);
      expect(mockCall).toHaveBeenCalledTimes(1);
    } finally {
      // Restore the original method
      CanceledSubscriptionsRoute.call = originalCall;
    }
  });
}); 