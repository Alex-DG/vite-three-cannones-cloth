import '../styles/app.css'
import Experience1 from './Experience/exp1'
import Experience2 from './Experience/exp2'

console.log('🎉', 'Project generated using vite-three-starter')
console.log(':: https://github.com/Alex-DG/vite-three-starter ::')

/**
 * Experience
 */
const urlParams = new URLSearchParams(window.location.search)
const exp = urlParams.get('exp')
const Experience = exp === '2' ? Experience2 : Experience1

new Experience({
  domElement: document.getElementById('experience'),
})
