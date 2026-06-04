import type { APIRoute } from 'astro';
import { generateDailyReview, getDailyReviewByDate } from '../../../services/daily-review-service';

export const GET: APIRoute = async ({ url }) => {
  try {
    const date = url.searchParams.get('date') || undefined;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Check if we already have a review for this date
    let review = getDailyReviewByDate(targetDate);

    if (!review) {
      // Generate one on demand
      review = await generateDailyReview(targetDate);
    }

    return new Response(JSON.stringify(review));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to get daily review';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const date = body?.date || undefined;
    const review = await generateDailyReview(date);
    return new Response(JSON.stringify(review), { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to generate daily review';
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
};
