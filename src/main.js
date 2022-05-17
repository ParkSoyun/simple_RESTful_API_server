// @ts-check

// 프레임워크 없이 간단한 토이프로젝트 웹 서버 만들어보기

/**
 * 블로그 포스팅 서비스
 * - 로컬 파일을 데이터베이스로 활용할 예정 (JSON)
 * - 인증 로직은 넣지 않음
 * - RESTful API를 사용
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
]

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
    res.statusCode = 200
    res.end('List of posts')
  } else if (postIdRegexResult) {
    const postId = postIdRegexResult[1]
    console.log(`postId: ${postId}`)
    res.statusCode = 200
    res.end('Some content of the post')
  } else if (req.url === '/posts' && req.method === 'POST') {
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
