import { Router, Response } from 'express';
import { checkoutInputSchema } from '@steady/shared';
import { authenticate, AuthenticatedRequest, requireClient, requireEmailVerified } from '../middleware/auth';
import { CommerceService } from '../services/commerce.service';

const router = Router();
const service = new CommerceService();
const protectedClient = [authenticate, requireEmailVerified, requireClient];
function failure(res: Response, error: unknown) { const message = error instanceof Error ? error.message : 'Commerce request failed'; res.status(message.includes('not found') ? 404 : 400).json({ success: false, message }); }

router.post('/checkout', ...protectedClient, async (req: AuthenticatedRequest, res) => {
  const parsed = checkoutInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, details: parsed.error.flatten() });
  try { res.status(201).json({ success: true, data: await service.createCheckout(req.user!.id, parsed.data.packageId, parsed.data.locale) }); } catch (error) { failure(res, error); }
});
router.get('/checkout/:attemptId', ...protectedClient, async (req: AuthenticatedRequest, res) => {
  try { res.json({ success: true, data: await service.getCheckoutStatus(req.user!.id, req.params.attemptId) }); } catch (error) { failure(res, error); }
});
router.delete('/purchases/:purchaseId', ...protectedClient, async (req: AuthenticatedRequest, res) => {
  try { res.json({ success: true, data: await service.cancelPending(req.user!.id, req.params.purchaseId) }); } catch (error) { failure(res, error); }
});
router.post('/webhook', async (req: AuthenticatedRequest, res) => {
  try { res.json({ received: true, data: await service.handleWebhook((req as AuthenticatedRequest & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body)), req.header('stripe-signature') ?? req.header('x-sandbox-signature') ?? undefined) }); }
  catch (error) { failure(res, error); }
});

export default router;
