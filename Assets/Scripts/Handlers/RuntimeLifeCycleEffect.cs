namespace DefaultNamespace
{
    internal class RuntimeLifeCycleEffect
    {
        public int remaningCycles;
        private LifeCycleEffectData _lifeCycleEffectDataReference;
        public LifeCycleEffectData LifeCycleEffectDataReference
        {
            get => _lifeCycleEffectDataReference;
            set
            {
                _lifeCycleEffectDataReference = value;
                remaningCycles = _lifeCycleEffectDataReference.effectDuration;
            }
        }
        
        private float FuelComsumptionPerPhase()
        {
            throw new System.NotImplementedException();
        }
    }
}