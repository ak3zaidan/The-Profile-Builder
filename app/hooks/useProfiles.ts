import { useReducer, useCallback } from 'react';
import { Profile } from '../types/profile';
import { faker } from '@faker-js/faker';

type State = {
  groupName: string;
  profiles: Profile[];
};

type Action =
  | { type: 'SET_GROUP_NAME'; payload: string }
  | { type: 'SET_PROFILES'; payload: Profile[] }
  | { type: 'UPDATE_PROFILE'; payload: Profile }
  | { type: 'ADD_PROFILE'; payload: Profile }
  | { type: 'DELETE_PROFILE'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_GROUP_NAME':
      return { ...state, groupName: action.payload };
    case 'SET_PROFILES':
      return { ...state, profiles: action.payload };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profiles: state.profiles.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'ADD_PROFILE':
      return { ...state, profiles: [...state.profiles, action.payload] };
    case 'DELETE_PROFILE':
      return { ...state, profiles: state.profiles.filter(p => p.id !== action.payload) };
    default:
      return state;
  }
}

export function useProfiles() {
  const [state, dispatch] = useReducer(reducer, { groupName: '', profiles: [] });

  const setGroupName = useCallback((name: string) => {
    dispatch({ type: 'SET_GROUP_NAME', payload: name });
  }, []);

  const setProfiles = useCallback((profiles: Profile[]) => {
    dispatch({ type: 'SET_PROFILES', payload: profiles });
  }, []);

  const updateProfile = useCallback((profile: Profile) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: profile });
  }, []);

  const addProfile = useCallback((profile: Profile) => {
    dispatch({ type: 'ADD_PROFILE', payload: profile });
  }, []);

  const deleteProfile = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PROFILE', payload: id });
  }, []);

  function createEmptyProfile(overrides?: Partial<Profile>): Profile {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
      id: Math.random().toString(36).slice(2),
      firstName,
      lastName,
      email: overrides?.email ?? faker.internet.email(),
      phone: overrides?.phone ?? faker.phone.number({ style: 'national'}),
      shippingAddress: { address1: '', city: '', state: '', zipCode: '', country: 'US', ...overrides?.shippingAddress },
      billingAddress: { address1: '', city: '', state: '', zipCode: '', country: 'US', ...overrides?.billingAddress },
      card: { number: '', expMonth: '', expYear: '', cvv: '', ...overrides?.card }
    };
  }

  return {
    groupName: state.groupName,
    profiles: state.profiles,
    setGroupName,
    setProfiles,
    updateProfile,
    addProfile,
    deleteProfile,
    createEmptyProfile
  };
}
