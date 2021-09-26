import { isEmail } from 'validator'

const params = {
  _sensitiveAttributes: true,
  _specialAttributes: true,
  _abilities: true,
}

export default async function ({ $axios, store }, inject) {
  if (process.server) {
    await initProfileInfo()
  }

  inject('auth', {
    login,
    logout,
    refresh: initProfileInfo,
  })

  /**
   * Init info of auth and commit it
   *
   * @returns {void}
   */
  async function initProfileInfo() {
    const { data: profile } = await $axios.$get('profile', {
      params,
      validateStatus: () => true,
    })

    store.commit('auth/profile', profile)
  }

  /**
   * Handle login user
   *
   * @param {string} loginOrEmail
   * @param {string} password
   * @param {boolean} remember false
   * @returns {boolean}
   */
  async function login(loginOrEmail, password, remember = false) {
    const info = {
      password,
      remember,
    }
    if (isEmail(loginOrEmail)) {
      info.email = loginOrEmail
    } else {
      info.login = loginOrEmail
    }

    const { status, data } = await $axios.post('login', info, {
      params,
    })
    if (status < 300) {
      store.commit('auth/profile', data.data)
    }
    return status < 300
  }

  /**
   * Handle logout user
   *
   * @returns {boolean}
   */
  async function logout() {
    const { status } = await $axios.post('logout')
    status < 300 && store.commit('auth/profile', undefined)
    return status < 300
  }
}
