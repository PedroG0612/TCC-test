export function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">About Appliety</h1>
      <div className="prose prose-slate mt-6 space-y-4 text-slate-600">
        <p>
          Appliety is a smart job marketplace and recruitment platform. It centralizes
          companies, candidates, job vacancies and applications in one place, using
          simple matching algorithms to recommend suitable opportunities and candidates.
        </p>
        <h2 className="text-xl font-bold text-slate-900">The problem we solve</h2>
        <p>
          Companies struggle to find qualified candidates, while students and
          professionals have difficulty identifying opportunities compatible with
          their profiles. Appliety addresses this by combining structured profiles,
          powerful search and an explainable compatibility score.
        </p>
        <h2 className="text-xl font-bold text-slate-900">How matching works</h2>
        <p>
          When you browse recommended jobs or candidates, Appliety compares the
          free-text profile of a candidate (headline, bio, education, skills and
          experience) with the vacancy description using a TF-IDF vector model and
          cosine similarity, blended with skill overlap. Each result shows a
          compatibility percentage and the skills both sides share.
        </p>
        <p className="text-sm text-slate-400">
          Note: the matcher is a transparent heuristic, not an advanced AI hiring
          model. It highlights textual and skill similarity — final decisions always
          remain with the people involved.
        </p>
      </div>
    </div>
  )
}
