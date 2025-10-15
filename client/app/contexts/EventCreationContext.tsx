"use client";

import React, {createContext, useContext, useReducer, ReactNode, useCallback} from "react";

export interface EventData {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  regularTickets: number;
  ticketPrice: string;
}

interface EventCreationState {
  eventData: EventData;
  currentStep: number;
}

type EventCreationAction =
  | {type: "UPDATE_BASIC_INFO"; payload: {title: string; description: string}}
  | {
      type: "UPDATE_SCHEDULE";
      payload: {
        location: string;
        startDate: string;
        startTime: string;
        endDate: string;
        endTime: string;
      };
    }
  | {
      type: "UPDATE_TICKETS";
      payload: {regularTickets: number; ticketPrice: string};
    }
  | {type: "SET_STEP"; payload: number}
  | {type: "RESET"};

const initialState: EventCreationState = {
  eventData: {
    title: "",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    regularTickets: 0,
    ticketPrice: "0.0π",
  },
  currentStep: 1,
};

function eventCreationReducer(
  state: EventCreationState,
  action: EventCreationAction
): EventCreationState {
  switch (action.type) {
    case "UPDATE_BASIC_INFO":
      return {
        ...state,
        eventData: {
          ...state.eventData,
          title: action.payload.title,
          description: action.payload.description,
        },
      };
    case "UPDATE_SCHEDULE":
      return {
        ...state,
        eventData: {
          ...state.eventData,
          location: action.payload.location,
          startDate: action.payload.startDate,
          startTime: action.payload.startTime,
          endDate: action.payload.endDate,
          endTime: action.payload.endTime,
        },
      };
    case "UPDATE_TICKETS":
      return {
        ...state,
        eventData: {
          ...state.eventData,
          regularTickets: action.payload.regularTickets,
          ticketPrice: action.payload.ticketPrice,
        },
      };
    case "SET_STEP":
      return {
        ...state,
        currentStep: action.payload,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface EventCreationContextType {
  state: EventCreationState;
  updateBasicInfo: (title: string, description: string) => void;
  updateSchedule: (
    location: string,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string
  ) => void;
  updateTickets: (regularTickets: number, ticketPrice: string) => void;
  setStep: (step: number) => void;
  reset: () => void;
}

const EventCreationContext = createContext<
  EventCreationContextType | undefined
>(undefined);

export function EventCreationProvider({children}: {children: ReactNode}) {
  const [state, dispatch] = useReducer(eventCreationReducer, initialState);

  const updateBasicInfo = useCallback((title: string, description: string) => {
    dispatch({type: "UPDATE_BASIC_INFO", payload: {title, description}});
  }, []);

  const updateSchedule = useCallback((
    location: string,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string
  ) => {
    dispatch({
      type: "UPDATE_SCHEDULE",
      payload: {location, startDate, startTime, endDate, endTime},
    });
  }, []);

  const updateTickets = useCallback((regularTickets: number, ticketPrice: string) => {
    dispatch({type: "UPDATE_TICKETS", payload: {regularTickets, ticketPrice}});
  }, []);

  const setStep = useCallback((step: number) => {
    dispatch({type: "SET_STEP", payload: step});
  }, []);

  const reset = useCallback(() => {
    dispatch({type: "RESET"});
  }, []);

  return (
    <EventCreationContext.Provider
      value={{
        state,
        updateBasicInfo,
        updateSchedule,
        updateTickets,
        setStep,
        reset,
      }}
    >
      {children}
    </EventCreationContext.Provider>
  );
}

export function useEventCreation() {
  const context = useContext(EventCreationContext);
  if (context === undefined) {
    throw new Error(
      "useEventCreation must be used within an EventCreationProvider"
    );
  }
  return context;
}
