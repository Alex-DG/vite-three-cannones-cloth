import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as CANNON from 'cannon-es'
import textureSrc from '../../assets/textures/texture.jpg'

class Experience {
  constructor(options) {
    this.scene = new THREE.Scene()
    this.container = options.domElement

    this.options = {
      sphere: {
        sphereSize: 0.1,
        movementRadius: 0.2,
      },
      cannon: {
        Nx: 15,
        Ny: 15,
        mass: 1,
        clothSize: 1,
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
    this.setCloth()
    this.setSphere()
    this.setResize()
    this.update()

    console.log('🤖', 'Experience initialized')
  }

  connect(i1, j1, i2, j2) {
    this.world.addConstraint(
      new CANNON.DistanceConstraint(
        this.particles[i1][j1],
        this.particles[i2][j2]
      )
    )
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
      24,
      this.sizes.width / this.sizes.height,
      1,
      2000
    )
    this.camera.position.set(4, 1, 1)
    this.camera.lookAt(0, 0, 0)
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

    const { Nx, Ny, mass, clothSize } = this.options.cannon

    const dist = clothSize / Nx
    const shape = new CANNON.Particle()

    this.particles = []

    // (1) Generate particles
    for (let i = 0; i < Nx + 1; i++) {
      this.particles.push([])
      for (let j = 0; j < Ny + 1; j++) {
        const particle = new CANNON.Body({
          mass: j === Ny ? 0 : mass,
          shape,
          position: new CANNON.Vec3(
            (i - Nx * 0.5) * dist,
            (j - Ny * 0.5) * dist,
            0
          ),
          velocity: new CANNON.Vec3(0, 0, -0.1 * (Ny - j)),
        })
        this.particles[i].push(particle)
        this.world.addBody(particle)
      }
    }

    // (2) Particles connection
    for (let i = 0; i < Nx + 1; i++) {
      for (let j = 0; j < Ny + 1; j++) {
        if (i < Nx) this.connect(i, j, i + 1, j)
        if (j < Ny) this.connect(i, j, i, j + 1)
      }
    }
  }

  setCloth() {
    const { Nx, Ny } = this.options.cannon
    this.clothGeometry = new THREE.PlaneGeometry(1, 1, Nx, Ny)
    this.clothMat = new THREE.MeshNormalMaterial({
      side: THREE.DoubleSide,
      wireframe: true,
      // map: new THREE.TextureLoader().load(textureSrc),
    })
    this.clothMesh = new THREE.Mesh(this.clothGeometry, this.clothMat)
    this.scene.add(this.clothMesh)
  }

  setSphere() {
    this.sphereGeometry = new THREE.SphereGeometry(
      this.options.sphere.sphereSize
    )
    this.sphereMat = new THREE.MeshPhongMaterial()
    this.sphereMesh = new THREE.Mesh(this.sphereGeometry, this.sphereMat)
    this.scene.add(this.sphereMesh)

    this.sphereShape = new CANNON.Sphere(this.options.sphere.sphereSize * 1.3)
    this.sphereBody = new CANNON.Body({ shape: this.sphereShape })
    this.world.addBody(this.sphereBody)
  }

  setLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const spotLight = new THREE.SpotLight(0xffffff, 0.9, Math.PI / 8, 1)
    spotLight.position.set(-3, 3, 10)
    spotLight.target.position.set(0, 0, 0)
    this.scene.add(spotLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0, 0, -10)
    directionalLight.target.position.set(0, 0, 0)
    this.scene.add(directionalLight)
  }

  setResize() {
    window.addEventListener('resize', this.resize)
  }

  //////////////////////////////////////////////////////////////////////////////

  updateParticules() {
    const { Nx, Ny } = this.options.cannon

    for (let i = 0; i < Nx + 1; i++) {
      for (let j = 0; j < Ny + 1; j++) {
        const index = j * (Nx + 1) + i

        const positionAttribute = this.clothGeometry.attributes.position

        const position = this.particles[i][Ny - j].position

        positionAttribute.setXYZ(index, position.x, position.y, position.z)
        positionAttribute.needsUpdate = true
      }
    }
  }

  update(time) {
    this.updateParticules()
    this.world.step(this.timeStep)
    this.sphereBody.position.set(
      this.options.sphere.movementRadius * Math.sin(time / 1000),
      0,
      this.options.sphere.movementRadius * Math.cos(time / 1000)
    )
    this.sphereMesh.position.copy(this.sphereBody.position)

    // Update controls
    this.controls.update()

    // Render
    this.renderer.render(this.scene, this.camera)

    // Call update again on the next frame
    window.requestAnimationFrame(this.update)
  }
}

export default Experience
