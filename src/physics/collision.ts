export interface CollisionParams {
  m1: number; // kg
  m2: number; // kg
  v1i: number; // initial velocity 1, m/s
  v2i: number; // initial velocity 2, m/s
  restitution: number; // e: 1 = perfectly elastic, 0 = perfectly inelastic
  trackLength: number; // length of air track (e.g. 10m)
}

export interface CartState {
  x: number;
  v: number;
  p: number; // momentum
  ke: number; // kinetic energy
}

export interface CollisionSimulationState {
  t: number;
  cart1: CartState;
  cart2: CartState;
  totalMomentum: number;
  totalKineticEnergy: number;
  hasCollided: boolean;
  timeOfCollision: number | null;
  postV1: number;
  postV2: number;
  energyLost: number;
}

export interface CollisionTheoretical {
  v1Final: number;
  v2Final: number;
  initialMomentum: number;
  finalMomentum: number;
  initialKE: number;
  finalKE: number;
  energyLost: number;
  energyLostPercentage: number;
  collisionDurationEstimateMs: number;
}

export function calculateCollisionTheoretical(p: CollisionParams): CollisionTheoretical {
  const { m1, m2, v1i, v2i, restitution: e } = p;
  const totalM = Math.max(0.001, m1 + m2);

  // 1D Collision with restitution e:
  // v1f = (m1 - e*m2)/(m1+m2)*v1i + (1+e)*m2/(m1+m2)*v2i
  // v2f = (1+e)*m1/(m1+m2)*v1i + (m2 - e*m1)/(m1+m2)*v2i
  const v1f = ((m1 - e * m2) / totalM) * v1i + (((1 + e) * m2) / totalM) * v2i;
  const v2f = (((1 + e) * m1) / totalM) * v1i + ((m2 - e * m1) / totalM) * v2i;

  const pInitial = m1 * v1i + m2 * v2i;
  const pFinal = m1 * v1f + m2 * v2f;

  const keInitial = 0.5 * m1 * v1i * v1i + 0.5 * m2 * v2i * v2i;
  const keFinal = 0.5 * m1 * v1f * v1f + 0.5 * m2 * v2f * v2f;
  const deltaKE = Math.max(0, keInitial - keFinal);
  const percentLost = keInitial > 1e-6 ? (deltaKE / keInitial) * 100 : 0;

  return {
    v1Final: v1f,
    v2Final: v2f,
    initialMomentum: pInitial,
    finalMomentum: pFinal,
    initialKE: keInitial,
    finalKE: keFinal,
    energyLost: deltaKE,
    energyLostPercentage: percentLost,
    collisionDurationEstimateMs: 25,
  };
}

export function createInitialCollisionState(params: CollisionParams): CollisionSimulationState {
  const track = params.trackLength;
  // Position cart 1 at 25% of track, cart 2 at 75% of track
  const x1 = track * 0.25;
  const x2 = track * 0.75;
  const p1 = params.m1 * params.v1i;
  const p2 = params.m2 * params.v2i;
  const ke1 = 0.5 * params.m1 * params.v1i * params.v1i;
  const ke2 = 0.5 * params.m2 * params.v2i * params.v2i;

  const theo = calculateCollisionTheoretical(params);

  return {
    t: 0,
    cart1: { x: x1, v: params.v1i, p: p1, ke: ke1 },
    cart2: { x: x2, v: params.v2i, p: p2, ke: ke2 },
    totalMomentum: p1 + p2,
    totalKineticEnergy: ke1 + ke2,
    hasCollided: false,
    timeOfCollision: null,
    postV1: theo.v1Final,
    postV2: theo.v2Final,
    energyLost: theo.energyLost,
  };
}

export function stepCollision(
  state: CollisionSimulationState,
  params: CollisionParams,
  dt: number
): CollisionSimulationState {
  const cartWidth = 0.4; // physical width in meters
  let { cart1, cart2, hasCollided, timeOfCollision } = state;
  const nextT = state.t + dt;

  let x1 = cart1.x + cart1.v * dt;
  let x2 = cart2.x + cart2.v * dt;
  let v1 = cart1.v;
  let v2 = cart2.v;

  // Collision detection between cart1 and cart2
  const distance = Math.abs(x2 - x1);
  const relativeVelocity = v1 - v2;

  if (!hasCollided && distance <= cartWidth && relativeVelocity > 0) {
    hasCollided = true;
    timeOfCollision = nextT;
    const theo = calculateCollisionTheoretical(params);
    v1 = theo.v1Final;
    v2 = theo.v2Final;
    // ensure no sticking/penetration
    if (x1 < x2) {
      x1 = (x1 + x2) / 2 - cartWidth / 2;
      x2 = (x1 + x2) / 2 + cartWidth / 2;
    }
  }

  // Track boundary bumper bounce (elastic bounce off end caps)
  const trackLeft = 0.2;
  const trackRight = params.trackLength - 0.2;
  if (x1 <= trackLeft && v1 < 0) {
    v1 = -v1;
    x1 = trackLeft;
  }
  if (x2 >= trackRight && v2 > 0) {
    v2 = -v2;
    x2 = trackRight;
  }

  const p1 = params.m1 * v1;
  const p2 = params.m2 * v2;
  const ke1 = 0.5 * params.m1 * v1 * v1;
  const ke2 = 0.5 * params.m2 * v2 * v2;

  return {
    t: nextT,
    cart1: { x: x1, v: v1, p: p1, ke: ke1 },
    cart2: { x: x2, v: v2, p: p2, ke: ke2 },
    totalMomentum: p1 + p2,
    totalKineticEnergy: ke1 + ke2,
    hasCollided,
    timeOfCollision,
    postV1: state.postV1,
    postV2: state.postV2,
    energyLost: state.energyLost,
  };
}
