// supabase/functions/send-sms/index.ts
import { serve } from 'https://deno.land/std@0.188.0/http/server.ts';
import * as crypto from 'https://deno.land/std@0.188.0/crypto/mod.ts';

const handler = async (req: Request) => {
  const { phone, code } = await req.json();
  
  if (!phone || !code) {
    return new Response(JSON.stringify({ success: false, error: '缺少参数' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  // 阿里云短信服务配置
  const accessKeyId = Deno.env.get('ALIYUN_ACCESS_KEY_ID')!;
  const accessKeySecret = Deno.env.get('ALIYUN_ACCESS_KEY_SECRET')!;
  const signName = Deno.env.get('ALIYUN_SMS_SIGN_NAME')!;
  const templateCode = Deno.env.get('ALIYUN_SMS_TEMPLATE_CODE')!;

  try {
    const result = await sendAliyunSms(phone, code, accessKeyId, accessKeySecret, signName, templateCode);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

async function sendAliyunSms(
  phone: string,
  code: string,
  accessKeyId: string,
  accessKeySecret: string,
  signName: string,
  templateCode: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const params = {
    PhoneNumbers: phone,
    SignName: signName,
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
  };

  const queryString = new URLSearchParams(params).toString();
  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '').slice(0, 15);
  
  const stringToSign = `GET&%2F&${encodeURIComponent(queryString)}`;
  
  const signature = crypto.hmac(
    'SHA-256',
    `${accessKeySecret}&`,
    stringToSign,
    'utf-8'
  );
  
  const signatureBase64 = btoa(String.fromCharCode(...signature));
  
  const url = `http://dysmsapi.aliyuncs.com/?${queryString}&Signature=${encodeURIComponent(signatureBase64)}&AccessKeyId=${accessKeyId}&Format=JSON&Version=2017-05-25&Action=SendSms&SignatureMethod=HMAC-SHA256&SignatureVersion=1.0&SignatureNonce=${Math.random().toString(36).slice(2)}&Timestamp=${timestamp}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.Code === 'OK') {
    return { success: true, message: '短信发送成功' };
  } else {
    return { success: false, error: data.Message || '发送失败' };
  }
}

serve(handler);