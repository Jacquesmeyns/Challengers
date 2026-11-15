using System.Collections.Generic;
using UnityEngine;

namespace DefaultNamespace
{
    public class GameManager : MonoBehaviour
    {
        [Header("GameData")]
        [SerializeField] SpaceProgramData[] spaceProgramData;
        [SerializeField] SpacecraftData[] allSpacecraftData;
        
        [Header("PlayerData")]
        [SerializeField] public SpacecraftData chosenSpacecraftData;
        [Range(0f,1000f)] public float remainingFuel;
        [SerializeReference] List<RuntimeLifeCycleEffect> lifeCycleEffects;
        
        
        //Runtime data
        RuntimeSpaceProgram currentSpaceProgram;

        public void StartGame(int chosenProgram)
        {
            StartSpaceProgram(chosenProgram);
        }

        public void StartSpaceProgram(int index)
        {
            currentSpaceProgram.Start(spaceProgramData[index]);
        }
    }
}