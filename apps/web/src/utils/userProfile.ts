export interface UserProfile {
  email: string;
  name: string;
  role: 'admin' | 'faculty';
  assigned_subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics' | 'All';
}

export function getUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem('eduforge_user');
    if (saved) {
      const u = JSON.parse(saved);
      const email = (u.email || '').toLowerCase();
      
      let assigned_subject = u.assigned_subject;
      if (!assigned_subject || assigned_subject === 'All') {
        if (email.includes('physics')) assigned_subject = 'Physics';
        else if (email.includes('chemistry')) assigned_subject = 'Chemistry';
        else if (email.includes('biology')) assigned_subject = 'Biology';
        else if (email.includes('maths') || email.includes('math')) assigned_subject = 'Mathematics';
        else assigned_subject = 'All';
      }

      const role = (email === 'admin@eduforge.com' || assigned_subject === 'All') ? 'admin' : 'faculty';

      return {
        email: u.email || 'admin@eduforge.com',
        name: u.name || (assigned_subject !== 'All' ? `${assigned_subject} Faculty` : 'System Admin'),
        role,
        assigned_subject
      };
    }
  } catch {}

  return {
    email: 'admin@eduforge.com',
    name: 'System Admin',
    role: 'admin',
    assigned_subject: 'All'
  };
}
