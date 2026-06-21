function Card(props) {
  return (
    <div className="card">
      <h2>
        {props.icon} {props.title}
      </h2>

      <p>{props.value}</p>
    </div>
  )
}

export default Card