// supabase/functions/verify-phone/index.ts
import { serve } from 'https://deno.land/std@0.188.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const handler = async (req: Request) => {
  const { phone, code } = await req.json();
  
  if (!phone || !code) {
    return new Response(JSON.stringify({ success: false, error: '缺少参数' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  // 验证验证码（这里使用简单的验证逻辑，实际应该从数据库或缓存中读取）
  const storedCode = await getVerificationCode(phone);
  
  if (!storedCode || storedCode !== code) {
    return new Response(JSON.stringify({ success: false, error: '验证码错误' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  // 更新用户的手机号验证状态
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error } = await supabase.auth.admin.updateUserById(phone, {
    phone: phone,
  });

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  // 删除已使用的验证码
  await deleteVerificationCode(phone);

  return new Response(JSON.stringify({ success: true, message: '验证成功' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

async function getVerificationCode(phone: string): Promise<string | null> {
  // 在实际应用中，应该从数据库或Redis中读取验证码
  // 这里使用内存存储作为示例（生产环境不推荐）
  const cache = await Deno.openKv();
  const result = await cache.get<string>(['sms_codes', phone]);
  return result.value || null;
}

async function deleteVerificationCode(phone: string): Promise<void> {
  const cache = await Deno.openKv();
  await cache.delete(['sms_codes', phone]);
}

serve(handler);