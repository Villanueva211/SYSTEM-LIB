import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const results: string[] = [];

  try {
    // 1. Find jayvee in auth.users first
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
    const jayvee = authList?.users?.find(u => u.email === 'jayvee.villanueva@urios.edu.ph');

    if (!jayvee) {
      results.push('❌ jayvee not found in auth.users — check email spelling');
    } else {
      results.push(`✅ Found jayvee in auth: id=${jayvee.id}`);

      // Upsert with correct id
      const { error: e1 } = await supabaseAdmin.from('users').upsert({
        id: jayvee.id,
        email: jayvee.email,
        name: jayvee.user_metadata?.name || 'jayvee.villanueva',
        role: 'admin',
      }, { onConflict: 'id' });

      results.push(e1 ? `❌ Upsert failed: ${e1.message}` : '✅ jayvee role set to admin');
    }

    // 2. Fix student
    const student = authList?.users?.find(u => u.email === 'student@library.com');
    if (!student) {
      const { data: newStudent, error: e2 } = await supabaseAdmin.auth.admin.createUser({
        email: 'student@library.com', password: 'student123',
        email_confirm: true, user_metadata: { name: 'Demo Student' },
      });
      if (!e2 && newStudent.user) {
        await supabaseAdmin.from('users').upsert({
          id: newStudent.user.id, email: 'student@library.com', name: 'Demo Student', role: 'user',
        }, { onConflict: 'id' });
        results.push('✅ Demo student created');
      } else {
        results.push(`❌ Student: ${e2?.message}`);
      }
    } else {
      await supabaseAdmin.from('users').upsert({
        id: student.id, email: 'student@library.com', name: 'Demo Student', role: 'user',
      }, { onConflict: 'id' });
      results.push('✅ Demo student synced');
    }

    // 3. Show final DB state
    const { data: users } = await supabaseAdmin.from('users').select('id, email, name, role');
    results.push(`DB users: ${JSON.stringify(users, null, 2)}`);

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, results });
  }
}
