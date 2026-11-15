using System;
using UnityEngine;

[Serializable]
public class MissionData : ScriptableObject
{
    public string name;
    public string description;
    public MissionPhase[] phases;
    public LifeCycleEffectData lifeCycleEffectData;
    }

[Serializable]
public class MissionPhase
{
    public GameResources resourcesCost;   //Cost per phase
}

public class RuntimeMissionData
{
    public MissionData missionData;

    public void Simulate()
    {
        throw new NotImplementedException();
    }
}
