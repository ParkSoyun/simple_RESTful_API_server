// @ts-check

// any type : 코드의 예측가능성을 떨어지고 문제의 소지가 있는 코드를 짤 가능성이 높음
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
 * @typedef APIResponse
 * @property {number} statusCode
 * @property {string | Object} body
 */

/**
 * @typedef Route
 * @property {RegExp} url
 * @property {'GET' | 'POST'} method
 * @property {(matches: string[], body: Object.<string, *> | undefined) => Promise<APIResponse>} callback
 *    => callback : url, method가 모두 매치되는 요청이 들어왔을 때 실행할 함수로 callback의 응답은 무조건 비동기로 돌아올 가능성이 높기 때문에 Promise를 사용
 *    => matches : 특정 id의 게시물을 불러오는 기능을 수행할 때 id 값을 넘겨주는 인자
 *    => body : 새 게시물을 등록할 때 해당 정보가 담겨있는 request Body 정보를 넘겨주는 인자
 */

/** @type {Route[]} */
const routes = [
  {
    url: /^\/posts$/,
    method: 'GET',
    callback: async () => ({
      statusCode: 200,
      body: posts,
    }),
  },
  {
    url: /^\/posts\/([a-zA-Z0-9-_]+$)/, // id 값 추출이 불가하므로 인자로 받아오는 것이 좋음
    method: 'GET',
    callback: async (matches) => {
      const postId = matches[1]

      if (!postId) {
        return {
          statusCode: 404,
          body: 'Not found.',
        }
      }

      const post = posts.find((_post) => _post.id === postId)

      if (!post) {
        return {
          statusCode: 404,
          body: 'Not found.',
        }
      }

      return {
        statusCode: 200,
        body: post,
      }
    },
  },
  {
    url: /^\/posts$/,
    method: 'POST',
    callback: async (_, body) => {
      if (!body) {
        return {
          statusCode: 400,
          body: 'Ill-formed request.',
        }
      }

      /** @type {string} */
      // eslint-disable-next-line prefer-destructuring
      const title = body.title

      const newPost = {
        id: title.toLowerCase().replace(/\s/g, '_'),
        title,
        content: body.content,
      }

      posts.push(newPost)

      return {
        statusCode: 200,
        body: newPost,
      }
    },
  },
]

module.exports = {
  routes,
} // 모듈에서 내보내는 것 (자바스크립트에선 각 파일이 모두 모듈임) => main.js 등 다른 파일에서 routes를 가져다 쓸 수 있음
