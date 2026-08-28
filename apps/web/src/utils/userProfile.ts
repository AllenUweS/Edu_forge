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

      if (email === 'admin@eduforge.com') {
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

      // Check if custom assigned_subject exists and is not 'All'/'None'
      if (u.assigned_subject && u.assigned_subject !== 'None' && u.assigned_subject !== 'All') {
        const sub = u.assigned_subject;
        const role = u.role === 'admin' ? 'admin' : 'faculty';
        return {
          email: u.email || '',
          name: u.name || `${sub} Faculty`,
          role,
          assigned_subject: sub
        };
      }

      // Explicit Check: if user is admin role with custom meta
      if (u.role === 'admin' && u.assigned_subject === 'All') {
        return {
          email: u.email || '',
          name: u.name || 'Administrator',
          role: 'admin',
          assigned_subject: 'All'
        };
      }

      // UNKNOWN / NEW REGISTERED RANDOM USER
      return {
        email: u.email || 'newuser@eduforge.com',
        name: u.name || (email.split('@')[0] ? email.split('@')[0] : 'New Registered User'),
        role: 'guest',
        assigned_subject: 'None'
      };
    }
  } catch {}

  return {
    email: 'guest@eduforge.com',
    name: 'Guest User',
    role: 'guest',
    assigned_subject: 'None'
  };
}
