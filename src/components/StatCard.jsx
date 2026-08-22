import PropTypes from 'prop-types';

const ACCENT_CLASSES = {
  indigo: {
    border: 'border-indigo-500',
    background: 'bg-indigo-50',
    icon: 'bg-indigo-100 text-indigo-700',
    value: 'text-indigo-700',
  },
  violet: {
    border: 'border-violet-500',
    background: 'bg-violet-50',
    icon: 'bg-violet-100 text-violet-700',
    value: 'text-violet-700',
  },
  pink: {
    border: 'border-pink-500',
    background: 'bg-pink-50',
    icon: 'bg-pink-100 text-pink-700',
    value: 'text-pink-700',
  },
  teal: {
    border: 'border-teal-500',
    background: 'bg-teal-50',
    icon: 'bg-teal-100 text-teal-700',
    value: 'text-teal-700',
  },
};

function StatCard({ label, value, icon = null, accent = 'indigo' }) {
  const classes = ACCENT_CLASSES[accent];

  return (
    <section
      aria-label={`${label}: ${value}`}
      className={`rounded-xl border border-l-4 border-slate-200 p-5 shadow-sm ${classes.border} ${classes.background}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${classes.value}`}>{value}</p>
        </div>

        {icon && (
          <span
            aria-hidden="true"
            className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${classes.icon}`}
          >
            {icon}
          </span>
        )}
      </div>
    </section>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.node,
  accent: PropTypes.oneOf(['indigo', 'violet', 'pink', 'teal']),
};

export default StatCard;