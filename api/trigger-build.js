/**
 * Vercel Serverless Function - Trigger Build
 * Called by Vercel Cron at 07:00 HKT (23:00 UTC) daily
 *
 * This endpoint triggers a new deployment via Deploy Hook,
 * which causes the build process to run (including npm run fetch)
 * and deploy fresh data.
 */

export default async function handler(req, res) {
  // Verify this is a cron request (optional security)
  const authHeader = req.headers.authorization;

  // Get the deploy hook URL from environment variable
  const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;

  if (!deployHookUrl) {
    console.log('VERCEL_DEPLOY_HOOK_URL not configured - skipping auto-deploy');
    return res.status(200).json({
      success: false,
      message: 'Deploy hook not configured. Set VERCEL_DEPLOY_HOOK_URL in Vercel Environment Variables.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Trigger the deploy hook
    const response = await fetch(deployHookUrl, {
      method: 'POST'
    });

    if (response.ok) {
      console.log('Deploy triggered successfully');
      return res.status(200).json({
        success: true,
        message: 'Deploy triggered successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Failed to trigger deploy:', response.status);
      return res.status(500).json({
        success: false,
        message: `Deploy hook returned ${response.status}`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error triggering deploy:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
