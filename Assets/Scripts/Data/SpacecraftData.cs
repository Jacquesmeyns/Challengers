using System;
using UnityEngine;

[Serializable]
public class SpacecraftData : ScriptableObject
{
    public string name;
    public string description;
    public float weight;
    public float scienceProduction;
    public float fuelConsumption;
    public float speed;
}