using System;
using UnityEngine;

[Serializable]
public class SpaceProgramData : ScriptableObject
{
    public MissionData[] missions;
}

public class RuntimeSpaceProgram
{
    public SpaceProgramData ProgramDataRef;
    public int currentMissionIndex;
    public RuntimeMissionData CurrentMissionData;

    public void Start(SpaceProgramData programData)
    {
        ProgramDataRef = programData;
        currentMissionIndex = 0;
        CurrentMissionData = new RuntimeMissionData {missionData = ProgramDataRef.missions[currentMissionIndex]};
    }
    
    public bool SimulatePhase() //True if there is another mission next
    {
        CurrentMissionData.Simulate();
        currentMissionIndex++;
        if (currentMissionIndex < ProgramDataRef.missions.Length)
        {
            CurrentMissionData = new RuntimeMissionData {missionData = ProgramDataRef.missions[currentMissionIndex]};
            return true;
        }

        return false;
    }
}

