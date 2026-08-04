// A small contextual notice above the grid — used for the cleaner visit.
export default function Banner({ icon, title, children }) {
  return (
    <div className="banner" role="note">
      {icon ? <span className="banner-icon" aria-hidden="true">{icon}</span> : null}
      <div className="banner-body">
        <strong className="banner-title">{title}</strong>
        {children ? <span className="banner-text">{children}</span> : null}
      </div>
    </div>
  )
}
