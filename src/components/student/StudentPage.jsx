export default function StudentPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  children,
  className = "",
}) {
  return (
    <div className={`student-page ${className}`}>
      <section className="student-page-hero">
        <div className="student-page-hero-pattern" />
        <div className="student-page-hero-main">
          {Icon && (
            <div className="student-page-hero-icon">
              <Icon size={23} />
            </div>
          )}
          <div>
            {eyebrow && <span>{eyebrow}</span>}
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
        </div>
        {action && <div className="student-page-hero-action">{action}</div>}
      </section>
      {children}
    </div>
  );
}
