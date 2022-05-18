// @ts-check

// 프레임워크 없이 간단한 토이프로젝트 웹 서버 만들어보기

/**
 * 블로그 포스팅 서비스
 * - 로컬 파일을 데이터베이스로 활용할 예정 (JSON)
 * - 인증 로직은 넣지 않음
 * - RESTful API를 사용
 */

/**
 * 유지보수성을 위해 리팩토링하기
 * 1. 현재 코드에서 중복된 로직 찾기: 현재 코드의 모든 if문 브랜치가 항상 따르는 일정한 규격이 있음 (statusCode를 받고 Header를 정하고 HTTP BODY를 쓰는 일)
 *                                   => 현재 코드에선 어느 if문 브랜치에서 해당 기능들이 빠져도 코드상에서 오류를 내지 않음(후에 런타임에 가서 문제가 생겨야만 알 수 있음) => 유지보수성이 떨어짐
 *                                   => 잘 추상화하여 함수 콜로 묶어두거나 타입체크를 하도록 막아주면 런타임에 가기 전에 오류를 찾아낼 수 있음
 *    => 로직을 묶기 위해서 추상화를 해야함, 추상화를 하는 것은 공통된 패턴을 빼내 항상 일정한 규격에 맞게 행동하도록 코드를 재건축하는 것을 말함
 */

const http = require('http')

/**
 * JSDoc
 * : 이 함수가 어떤 파라미터를 받고, 어떤 값을 리턴하고, 파라미터의 의미는 어떤 것인가 등을 주석으로 남기는 표준화된 방식 중 하나
 *   => 자동으로 typescript가 파싱하여 타입정보를 만들어 줌
 * @typedef Post
 * @property {string} id
 * @property {string} title
 * @property {string} content
 */

/** @type {Post[]} */
const posts = [
  {
    id: 'my_first_post',
    title: 'My first post',
    content: 'Hello!',
  },
  {
    id: 'my_second_post',
    title: 'My second post',
    content: 'Second post!',
  },
  {
    id: 'my_third_post',
    title: '나의 세번째 포스트',
    content: '세번째 포스트!',
  },
] // 데이터베이스를 사용하지 않고 인메모리에 데이터들을 저장하여 테스트

/**
 * Post
 *
 * 포스트 전체 리스트 보기 : GET /posts
 * 특정 포스트 보기 : GET /posts/:id
 * 새로운 Post 작성 : POST /posts
 */

const server = http.createServer((req, res) => {
  /**
   * 정규식
   * /^ : 시작을 알리는 문자
   * $/ : 끝을 알리는 문자
   * \ : 바로 뒤에 오는 문자에 대한 이스케이프를 하겠다는 의미
   *
   * 캡처 그룹 : 정규식 중 확인하고자 하는 부분의 값이 무엇인지 뽑아내는 기능
   *    => 사용 방법 : 확인하고자하는 부분을 ()로 감싸줌
   *
   * test() : 반환값이 boolean타입으로 해당 정규식 패턴에 맞는지 아닌지만 판단
   * exec() : 실행 후 패턴에 맞다면 어떻게 맞는지까지 알려줌
   */

  /**
   * && : A && B의 경우 A가 true인 경우에만 B를 수행
   * || : A || B의 경우 A가 fasle인 경우 B를 반드시 수행
   */

  const POSTS_ID_REGEX = /^\/posts\/([a-zA-Z0-9-_]+)$/
  const postIdRegexResult =
    (req.url && POSTS_ID_REGEX.exec(req.url)) || undefined // 첫번째 else if문에서 조건식에서도 exec()를 하고 내부에서도 exec()를 또 해주고 있어 이를 줄이기 위해 밖으로 꺼냄

  if (req.url === '/posts' && req.method === 'GET') {
    const result = {
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
      })),
      totalCount: posts.length,
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; encoding=utf-8') // 응답의 타입이 json형태라는 것을 알려줌
    res.end(JSON.stringify(result)) // result는 plain javascript object이므로 http의 바디에선 string으로 담겨지기 때문에 JSON.stringify()를 이용하여 result를 JSON 형태인 string으로 출력
  } else if (postIdRegexResult && req.method === 'GET') {
    const postId = postIdRegexResult[1]
    const post = posts.find((_post) => _post.id === postId)

    if (post) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(post))
    } else {
      res.statusCode = 404
      res.end('Post not found.')
    }
  } else if (req.url === '/posts' && req.method === 'POST') {
    /**
     * POST 메서드로 보내는 법 : http POST localhost:5000/posts title=foo content=bar
     * POST로 보낸 값과 받은 값 모두 출력해보기 : http POST localhost:5000/posts title=foo content=bar --print=hHbB
     *    => h : 응답의 헤더, b : 응답의 바디, H : 요청의 헤더, B : 요청의 바디
     */
    req.setEncoding('utf-8') // 없으면 Buffer가 찍힘 (바이너리 데이터가 그대로 찍힘)
    req.on('data', (data) => {
      /**
       * @typedef CreatePostBody
       * @property {string} title
       * @property {string} content
       */

      /** @type {CreatePostBody} */
      const body = JSON.parse(data)
      posts.push({
        id: body.title.toLowerCase().replace(/\s/g, '_'), // 그냥 replace(' ', '_')를 하면 제일 첫번째 공백만 바뀌므로 정규식을 활용하여 모든 공백을 _로 변경하도록 함 => \s : 공백, g : 모든 경우
        title: body.title,
        content: body.content,
      })
    }) // request로 들어온 post의 body 정보 읽기(data 이벤트에 대해 리슨해야 함)

    res.statusCode = 200
    res.end('Creating post')
  } else {
    res.statusCode = 404
    res.end('Not found.')
  }
})

const PORT = 5000

server.listen(PORT, () => {
  console.log(`The server is listening at port: ${PORT}`)
})
