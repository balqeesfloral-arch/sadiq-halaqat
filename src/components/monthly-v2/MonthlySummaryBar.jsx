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
        borderRadius:"18px",
        padding:"18px 24px",
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