// 単元の行に付ける小さな絵。分野（curriculum.ts の TAGS の順番）ごとに、中身を絵で伝える
// 0 数の理解: 並んだ丸 / 1 たし算・ひき算: 2色の丸 / 2 形・図形: いろいろな形 / 3 長さ・広さ・かさ・時計: 長さのちがう棒
export function TagPicture({ index }: { index: number }) {
  const pieces =
    index === 1
      ? ['a', 'a', 'a', 'b', 'b', 'b', 'b']
      : index === 2
        ? ['circle', 'square', 'triangle']
        : index === 3
          ? ['bar-long', 'bar-mid', 'bar-short']
          : ['c', 'c', 'c', 'c', 'c']
  return (
    <span className="row-picture" data-kind={index} aria-hidden="true">
      <span>
        {pieces.map((piece, i) => (
          <i key={i} data-piece={piece} />
        ))}
      </span>
    </span>
  )
}
