using System;
using UnityEngine;

[Serializable]
public class LifeCycleEffectData : ScriptableObject    //All are good
{
    public int effectDuration;  //phases
    public float weightMult; //Inverse multiplier
    public float scienceMult;
    public float fuelEfficiencyMult;    //Decreases fuel use per phase
}