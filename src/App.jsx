import axios from 'axios'
import { useEffect, useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'

export default function SolarSystem() {
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '')
  const [askNickname, setAskNickname] = useState(!localStorage.getItem('nickname'))
  const [editingId, setEditingId] = useState(null)
  const [editingContent, setEditingContent] = useState('')

  useEffect(() => {
    if (selectedPlanet) {
      fetchComments()
    }
  }, [selectedPlanet])

  const fetchComments = async () => {
    const res = await axios.get(`http://localhost:8000/comments?planet=${selectedPlanet.name}`)
    setComments(res.data)
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    await axios.post('http://localhost:8000/comments', {
      planet: selectedPlanet.name,
      content: newComment,
      author: nickname,
    })
    setNewComment('')
    fetchComments()
  }

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:8000/comments/${id}`)
    fetchComments()
  }

  const handleUpdate = async (id) => {
    await axios.put(`http://localhost:8000/comments/${id}`, {
      content: editingContent,
    })    
    setEditingId(null)
    setEditingContent('')
    fetchComments()
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative' }}>
      <Canvas camera={{ position: [0, 10, 20], fov: 60 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2.5} />
        <OrbitControls />
        <Sun />
        <OrbitRing radius={3} />
        <PlanetOrbit name="수성" description="수성은 태양에서 가장 가까운 행성입니다." texture="/mercury.jpg" distance={3} size={0.3} speed={1.5} onClick={setSelectedPlanet} />
        <OrbitRing radius={5} />
        <PlanetOrbit name="금성" description="금성은 지구와 비슷한 크기의 뜨거운 행성입니다." texture="/venus.jpg" distance={5} size={0.6} speed={1.2} onClick={setSelectedPlanet} />
        <OrbitRing radius={7} />
        <PlanetOrbit name="지구" description="우리가 살고 있는 유일한 생명체 행성입니다." texture="/earth.jpg" distance={7} size={0.7} speed={1.0} onClick={setSelectedPlanet} />
        <OrbitRing radius={9} />
        <PlanetOrbit name="화성" description="붉은색을 띄는, 탐사선이 도착한 행성입니다." texture="/mars.jpg" distance={9} size={0.5} speed={0.8} onClick={setSelectedPlanet} />
      </Canvas>

      {selectedPlanet && (
        <div style={modalStyle}>
          <h2>{selectedPlanet.name}</h2>
          <p>{selectedPlanet.description}</p>

          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <h3>💬 댓글</h3>
            <ul style={{ maxHeight: '120px', overflowY: 'auto', padding: 0 }}>
              {comments.map((c) => (
                <li key={c.id} style={{ listStyle: 'none', marginBottom: '8px' }}>
                  <strong>{c.author || '익명'}:</strong>{' '}
                  {editingId === c.id ? (
                    <>
                      <input
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        style={inputStyle}
                      />
                      <button onClick={() => handleUpdate(c.id)} style={submitBtnStyle}>저장</button>
                      <button onClick={() => setEditingId(null)} style={deleteBtnStyle}>취소</button>
                    </>
                  ) : (
                    <>
                      {c.content}
                      {c.author === nickname && (
                        <>
                          <button onClick={() => {
                            setEditingId(c.id)
                            setEditingContent(c.content)
                          }} style={submitBtnStyle}>수정</button>
                          <button onClick={() => handleDelete(c.id)} style={deleteBtnStyle}>삭제</button>
                        </>
                      )}
                    </>
                  )}
                </li>
              ))}
              {comments.length === 0 && <li>아직 댓글이 없습니다.</li>}
            </ul>

            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              rows={2}
              placeholder="댓글을 입력하세요"
              style={textareaStyle}
            />
            <button onClick={handleSubmit} style={submitBtnStyle}>댓글 작성</button>
          </div>

          <button onClick={() => setSelectedPlanet(null)} style={closeBtnStyle}>닫기</button>
        </div>
      )}

      {askNickname && (
        <div style={nicknameModalStyle}>
          <h3>닉네임을 입력하세요</h3>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={() => {
              if (nickname.trim()) {
                localStorage.setItem('nickname', nickname)
                setAskNickname(false)
              }
            }}
            style={submitBtnStyle}
          >
            저장
          </button>
        </div>
      )}
    </div>
  )
}
function Sun() {
  const texture = useTexture('/sun.jpg')
  return (
    <mesh>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

function PlanetOrbit({ texture, distance, size, speed, name, description, onClick }) {
  const planetRef = useRef()
  const tex = useTexture(texture)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const angle = t * speed
    const x = distance * Math.cos(angle)
    const z = distance * Math.sin(angle)
    if (planetRef.current) {
      planetRef.current.position.set(x, 0, z)
      planetRef.current.rotation.y += 0.05
    }
  })

  return (
    <mesh
      ref={planetRef}
      onClick={(e) => {
        e.stopPropagation()
        onClick({ name, description })
      }}
    >
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        map={tex}
        metalness={0.2}
        roughness={0.5}
        emissive={new THREE.Color(0x222222)}
        emissiveIntensity={0.8}
      />
    </mesh>
  )
}

function OrbitRing({ radius = 5, count = 200 }) {
  const positions = useMemo(() => {
    const points = []
    for (let i = 0; i < count; i++) {
      const angle = -(i / count) * Math.PI * 2
      const x = radius * Math.cos(angle)
      const z = radius * Math.sin(angle)
      points.push(x, 0, z)
    }
    return new Float32Array(points.flat())
  }, [radius, count])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [positions])

  return (
    <points geometry={geometry}>
      <pointsMaterial color="white" size={0.05} sizeAttenuation />
    </points>
  )
}

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'rgba(20, 20, 30, 0.95)',
  color: 'white',
  padding: '24px 32px',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
  zIndex: 999,
  backdropFilter: 'blur(6px)',
  textAlign: 'center',
  fontFamily: 'Orbitron, sans-serif',
  maxWidth: '500px',
  width: '90%',
}

const closeBtnStyle = {
  marginTop: '24px',
  background: '#111',
  color: '#00d0ff',
  padding: '8px 16px',
  border: '1px solid #00d0ff',
  borderRadius: '8px',
  cursor: 'pointer',
  width: '100%',
  clear: 'both',
}

const deleteBtnStyle = {
  marginLeft: '10px',
  color: 'red',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
}

const submitBtnStyle = {
  marginLeft: '6px',
  background: '#00d0ff',
  color: '#000',
  padding: '4px 10px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}

const textareaStyle = {
  width: '100%',
  resize: 'none',
  padding: '8px',
  background: '#111',
  color: 'white',
  border: '1px solid #444',
  borderRadius: '6px',
}

const nicknameModalStyle = {
  position: 'fixed',
  top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  background: '#111', padding: '24px',
  border: '1px solid #00d0ff',
  borderRadius: '8px',
  color: 'white',
  zIndex: 9999,
  textAlign: 'center',
}

const inputStyle = {
  marginTop: '8px',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #555',
  background: '#222',
  color: 'white',
  width: '80%',
}
