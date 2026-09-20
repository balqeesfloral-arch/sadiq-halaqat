export default function MonthlySummaryBar({

  total,
  completed,
  delayed

}) {

  return (

    <div
      style={{
        marginTop:"24px",
        background:"#fff",
        border:"1px solid #E2E8F0",
        borderRadius:"calc(18px * var(--app-radius-scale,1))",
        padding:"calc(18px * var(--app-density,1)) calc(24px * var(--app-density,1))",
        display:"flex",
        justifyContent:"space-between",
        flexWrap:"wrap"
      }}
    >

      <div>
        عدد الطلاب:
        <strong>
          {total}
        </strong>
      </div>

      <div>
        المنجزون:
        <strong>
          {completed}
        </strong>
      </div>

      <div>
        المتعثرون:
        <strong>
          {delayed}
        </strong>
      </div>

    </div>
  );
}