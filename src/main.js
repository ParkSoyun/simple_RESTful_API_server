// @ts-check

// 프레임워크 없이 간단한 토이프로젝트 웹 서버 만들어보기

/**
 * 블로그 포스팅 서비스
 * - 로컬 파일을 데이터베이스로 활용할 예정 (JSON)
 * - 인증 로직은 넣지 않음
 * - RESTful API를 사용
 *
 * Post
 * 포스트 전체 리스트 보기 : GET /posts
 * 특정 포스트 보기 : GET /posts/:id
 * 새로운 Post 작성 : POST /posts
 */

/**
 * 유지보수성을 위해 리팩토링하기
 * 1. 현재 코드에서 중복된 로직 찾기: 현재 코드의 모든 if문 브랜치가 항상 따르는 일정한 규격이 있음 (statusCode를 받고 Header를 정하고 HTTP BODY를 쓰는 일)
 *                                   => 현재 코드에선 어느 if문 브랜치에서 해당 기능들이 빠져도 코드상에서 오류를 내지 않음(후에 런타임에 가서 문제가 생겨야만 알 수 있음) => 유지보수성이 떨어짐
 *                                   => 잘 추상화하여 함수 콜로 묶어두거나 타입체크를 하도록 막아주면 런타임에 가기 전에 오류를 찾아낼 수 있음
 *    => 로직을 묶기 위해서 추상화를 해야함, 추상화를 하는 것은 공통된 패턴을 빼내 항상 일정한 규격에 맞게 행동하도록 코드를 재건축하는 것을 말함
 */

const http = require('http')
const { routes } = require('./api') // api.js에서 routes를 가져와 활용하기 위해 모듈을 가져옴

const server = http.createServer((req, res) => {
  async function main() {
    const route = routes.find(
      (_route) =>
        req.url &&
        req.method &&
        _route.url.test(req.url) &&
        _route.method === req.method
    ) // req.url이 있고 req.method가 존재할 때 req.url이 _route.url과 일치하면서 req.method가 _route.method와 일치하는 것 찾기

    if (!req.url || !route) {
      res.statusCode = 404
      res.end('Not found.')
      return
    } // 만약 route가 없는 상황에 대해 처리해줌(해당 코드 이후부턴 route가 항상 존재하게 됨)

    const regexResult = route.url.exec(req.url)

    if (!regexResult) {
      res.statusCode = 404
      res.end('Not found.')
      return
    }

    /** @type {Object.<string, *> | undefined} */
    const reqBody =
      (req.headers['content-type'] === 'application/json' && // 필요없는 경우에도 데이터를 받아내는 경우를 막기 위해 content-type이 application/json일 때만 실행되도록 함
        (await new Promise((resolve, reject) => {
          // 위에서 아래로 흘러가는 자연스러운 흐름을 만들고 싶을 때 이처럼 인라인으로 promise를 만들어 해결(가장 좋은 방식은 aysnc function을 외부에 만들어서 호출하는 것)
          req.setEncoding('utf-8')
          req.on('data', (data) => {
            try {
              resolve(JSON.parse(data)) // reqBody를 인자로 받아서 callback처리 시에 데이터를 더 쉽게 가공할 수 있도록 Object 타입으로 만들어 주기 위해
            } catch {
              reject(new Error('Ill-formed json'))
            }
          })
        }))) ||
      undefined // 새 게시물 추가 기능 때 request의 body 정보가 필요하기 때문에 이를 추출

    const result = await route.callback(regexResult, reqBody) // 특정 id의 게시물을 출력하는 기능을 위해 id 값을 추출하여 인자로 넘겨줌

    res.statusCode = result.statusCode

    if (typeof result.body === 'string') {
      res.end(result.body)
    } else {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(result.body))
    }
  }

  main()
})

const PORT = 5000

server.listen(PORT, () => {
  console.log(`The server is listening at port: ${PORT}`)
})
