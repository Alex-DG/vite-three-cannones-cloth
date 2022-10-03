import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as CANNON from 'cannon-es'

class Experience {
  constructor(options) {
    this.scene = new THREE.Scene()
    this.container = options.domElement

    this.options = {
      cannon: {
        rows: 18,
        cols: 18,
        mass: 1,
        dist: 0.2,
      },
    }

    this.timeStep = 1 / 60

    this.init()
  }

  /**
   * Experience setup
   */
  init() {
    this.bind()
    this.setSizes()
    this.setRenderer()
    this.setCamera()
    this.setLight()
    this.setCannon()
    this.setResize()
    this.update()

    console.log('🤖', 'Experience initialized')
  }

  bind() {
    this.resize = this.resize.bind(this)
    this.update = this.update.bind(this)
  }

  resize() {
    // Update sizes
    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight

    // Update camera
    this.camera.aspect = this.sizes.width / this.sizes.height
    this.camera.updateProjectionMatrix()

    // Update renderer
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  connect(i1, j1, i2, j2, dist) {
    this.world.addConstraint(
      new CANNON.DistanceConstraint(
        this.particles[`${i1} ${j1}`],
        this.particles[`${i2} ${j2}`],
        dist
      )
    )
    // this.world.addConstraint(distanceContraint)
  }

  //////////////////////////////////////////////////////////////////////////////

  setSizes() {
    this.sizes = {
      width: this.container.offsetWidth,
      height: this.container.offsetHeight || window.innerHeight,
    }
  }

  setCamera() {
    // Base camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.sizes.width / this.sizes.height,
      1,
      1000
    )
    this.camera.position.set(6, 8, 4)
    this.scene.add(this.camera)

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.container.appendChild(this.renderer.domElement)
  }

  setCannon() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.81, 0),
    })

    const { rows, cols, mass, dist, sphere } = this.options.cannon

    const shape = new CANNON.Particle()

    this.particles = {}

    const particleGeo = new THREE.SphereBufferGeometry(0.1)
    const particleMat = new THREE.MeshPhongMaterial({ color: 0xffea00 })

    this.meshesArray = []
    this.bodiesArray = []

    for (let i = 0; i < cols + 1; i++) {
      for (let j = 0; j < rows + 1; j++) {
        const particleBody = new CANNON.Body({
          mass,
          shape,
          position: new CANNON.Vec3(
            -(i - cols * 0.5) * dist,
            1,
            (j - rows * 0.5) * dist
          ),
          // velocity: new CANNON.Vec3(0, 0, -0.1 * (rows - j)),
        })
        this.particles[`${i} ${j}`] = particleBody
        this.world.addBody(particleBody)
        this.bodiesArray.push(particleBody)

        const particleMesh = new THREE.Mesh(particleGeo, particleMat)
        this.scene.add(particleMesh)
        this.meshesArray.push(particleMesh)
      }
    }

    const sphereBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Sphere(1.5),
    })
    this.world.addBody(sphereBody)
    this.bodiesArray.push(sphereBody)

    const sphereGeo = new THREE.SphereGeometry(1.5, 25, 25)
    const sphereMat = new THREE.MeshPhongMaterial({ color: 0xa3a3a3 })
    this.sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
    this.scene.add(this.sphereMesh)

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (i < cols - 1) {
          this.connect(i, j, i + 1, j, dist)
        }

        if (i < rows - 1) {
          this.connect(i, j, i, j + 1, dist)
        }
      }
    }
  }

  setLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7)
    directionalLight.position.set(0, 2, 2)
    directionalLight.target.position.set(0, 0, 0)
    this.scene.add(directionalLight)
  }

  setResize() {
    window.addEventListener('resize', this.resize)
  }

  //////////////////////////////////////////////////////////////////////////////

  update(time) {
    // this.updateParticules()
    this.world?.step(this.timeStep)
    for (let i = 0; i < this.meshesArray.length; i++) {
      this.meshesArray[i].position.copy(this.bodiesArray[i].position)
    }

    // Update controls
    this.controls.update()

    // Render
    this.renderer.render(this.scene, this.camera)

    // Call update again on the next frame
    window.requestAnimationFrame(this.update)
  }
}

export default Experience
