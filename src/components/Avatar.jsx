import PropTypes from 'prop-types';
import { ROLES } from '../utils/constants';

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-lg',
  lg: 'h-14 w-14 text-2xl',
};

/**
 * Returns role-specific avatar presentation details.
 *
 * @param {unknown} role - Account role.
 * @returns {{emoji: string, className: string, label: string}} Avatar details.
 */
export function getAvatar(role) {
  if (role === ROLES.admin) {
    return {
      emoji: '👑',
      className: 'bg-violet-600',
      label: 'Admin avatar',
    };
  }

  return {
    emoji: '📖',
    className: 'bg-indigo-500',
    label: 'User avatar',
  };
}

function Avatar({ role, size = 'md', className = '' }) {
  const avatar = getAvatar(role);

  return (
    <span
      aria-label={avatar.label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-white shadow-sm ${avatar.className} ${SIZE_CLASSES[size]} ${className}`}
      role="img"
    >
      <span aria-hidden="true">{avatar.emoji}</span>
    </span>
  );
}

Avatar.propTypes = {
  role: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default Avatar;