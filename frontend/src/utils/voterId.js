export function getVoterIdentifier(roomId) {
  const storageKey = `vote_voter_id_${roomId}`;
  
  let voterId = localStorage.getItem(storageKey);
  if (!voterId) {
    const randomId = 'voter_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    voterId = btoa(randomId).slice(0, 32);
    localStorage.setItem(storageKey, voterId);
  }
  
  return voterId;
}

export function hasVoted(roomId) {
  return localStorage.getItem(`vote_done_${roomId}`) === 'true';
}

export function setVoted(roomId) {
  localStorage.setItem(`vote_done_${roomId}`, 'true');
}
