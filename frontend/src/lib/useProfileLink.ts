import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * Opens a person's profile: your own id -> /profile, anybody else -> /user/:id (read-only public profile).
 * Demo posts that don't come from the server have no real user id, so they just show a short notice.
 */
export function useProfileLink() {
  const navigate = useNavigate();
  const { user, addToast } = useApp();
  return (userId: string | undefined, name?: string) => {
    if (userId && userId === user.id) {
      navigate('/profile');
    } else if (userId && /^\d+$/.test(userId)) {
      navigate(`/user/${userId}`);
    } else {
      addToast(name ?? 'Profile', 'Profiles are only available for people on the live server.', 'info');
    }
  };
}
