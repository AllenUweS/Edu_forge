export interface UserProfile {
  email: string;
  name: string;
  role: 'admin' | 'faculty' | 'guest';
  assigned_subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics' | 'All' | 'None';
}

export function getUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem('eduforge_user');
    if (saved) {
      const u = JSON.parse(saved);
      const email = (u.email || '').toLowerCase().trim();

      // If user profile has explicitly saved role & assigned_subject, respect it directly!
      if (u.role && u.assigned_subject) {
        return {
          email: u.email || email,
          name: u.name || (email.split('@')[0] || 'Faculty Member'),
          role: u.role,
          assigned_subject: u.assigned_subject
        };
      }

      if (email === 'admin@eduforge.com' || email.startsWith('admin@')) {
        return {
          email: u.email || 'admin@eduforge.com',
          name: u.name || 'System Admin',
          role: 'admin',
          assigned_subject: 'All'
        };
      }

      if (email.includes('physics')) {
        return {
          email: u.email || 'physics@eduforge.com',
          name: u.name || 'Physics Faculty',
          role: 'faculty',
          assigned_subject: 'Physics'
        };
      }

      if (email.includes('chemistry')) {
        return {
          email: u.email || 'chemistry@eduforge.com',
          name: u.name || 'Chemistry Faculty',
          role: 'faculty',
          assigned_subject: 'Chemistry'
        };
      }

      if (email.includes('biology')) {
        return {
          email: u.email || 'biology@eduforge.com',
          name: u.name || 'Biology Faculty',
          role: 'faculty',
          assigned_subject: 'Biology'
        };
      }

      if (email.includes('maths') || email.includes('math')) {
        return {
          email: u.email || 'maths@eduforge.com',
          name: u.name || 'Mathematics Faculty',
          role: 'faculty',
          assigned_subject: 'Mathematics'
        };
      }

      return {
        email: u.email || email,
        name: u.name || (email.split('@')[0] || 'Faculty Member'),
        role: 'faculty',
        assigned_subject: 'Biology'
      };
    }
  } catch {}

  return {
    email: 'admin@eduforge.com',
    name: 'Administrator',
    role: 'admin',
    assigned_subject: 'All'
  };
}
