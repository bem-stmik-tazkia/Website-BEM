import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Whitelist allowed webhook URLs (Google Apps Script domains only)
const ALLOWED_WEBHOOK_HOSTS = [
  'script.google.com',
  'script.googleusercontent.com',
];

function isAllowedWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_WEBHOOK_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Auth check – only authenticated users can forward to webhook
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { webhookUrl, payload } = data;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not provided' }, { status: 400 });
    }

    // SSRF protection – only allow whitelisted domains
    if (!isAllowedWebhookUrl(webhookUrl)) {
      return NextResponse.json(
        { error: 'Webhook URL is not allowed. Only Google Apps Script URLs are permitted.' },
        { status: 403 }
      );
    }

    // Forward data to Google Apps Script Web App
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    // Google Apps Script usually returns HTML or JSON
    const text = await response.text();
    let result: any = text;
    try {
      result = JSON.parse(text);
    } catch (e) {
      // It's fine, it might be HTML or simple text
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error forwarding to webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
