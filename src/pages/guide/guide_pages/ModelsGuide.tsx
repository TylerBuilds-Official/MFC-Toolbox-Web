import { Check } from 'lucide-react';
import GuidePage from '../GuidePage';
import { GuideTip, GuideTryIt } from '../../../components/guide';

const ModelsGuide = () => {
    return (
        <GuidePage>
            <header className="guide-page-header">
                <h1 className="guide-page-title">Models & Providers</h1>
                <p className="guide-page-description">
                    FabCore AI supports multiple AI providers and models. Each has its own 
                    strengths, so understanding the differences helps you pick the right tool for the job.
                </p>
            </header>

            <section className="guide-section">
                <h2 className="guide-section-title">Choosing a Provider</h2>
                <div className="guide-section-content">
                    <p>
                        You can switch between <strong>OpenAI</strong> and <strong>Anthropic</strong> at any time. 
                        Both providers offer powerful models with similar capabilities—they can handle most tasks 
                        you throw at them. The main differences are in tone, style, and where each one really shines.
                    </p>
                    <p>
                        Think of it like choosing between two skilled colleagues. They can both do the work, 
                        but one might be better suited for certain tasks based on their strengths.
                    </p>
                </div>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Provider Strengths</h2>
                
                <div className="guide-model-cards">
                    <div className="guide-model-card">
                        <div className="guide-model-card-header">
                            <span className="guide-model-card-badge openai">OpenAI</span>
                        </div>
                        <h3 className="guide-model-card-title">GPT Models</h3>
                        <div className="guide-model-card-content">
                            <p>
                                OpenAI's GPT models have a natural, conversational tone that works great 
                                for communication tasks. If you're drafting emails, writing documentation, 
                                or need help with creative content, GPT often feels more polished.
                            </p>
                        </div>
                        <div className="guide-model-card-strengths">
                            <div className="guide-model-card-strengths-title">Best for</div>
                            <div className="guide-model-card-strengths-list">
                                <span className="guide-model-card-strength">
                                    <Check size={14} /> Emails
                                </span>
                                <span className="guide-model-card-strength">
                                    <Check size={14} /> Writing
                                </span>
                                <span className="guide-model-card-strength">
                                    <Check size={14} /> Documentation
                                </span>
                                <span className="guide-model-card-strength">
                                    <Check size={14} /> Creative content
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="guide-model-card">
                        <div className="guide-model-card-header">
                            <span className="guide-model-card-badge anthropic">Anthropic</span>
                        </div>
                        <h3 className="guide-model-card-title">Claude Models</h3>
                        <div className="guide-model-card-content">
                            <p>
                                Anthropic's Claude models excel at reasoning and analysis. When you need 
                                to crunch numbers, generate reports, or work through complex data, 
                                Claude's higher reasoning capabilities really stand out.
                            </p>
                        </div>
                        <div className="guide-model-card-strengths">
                            <div className="guide-model-card-strengths-title">Best for</div>
                            <div className="guide-model-card-strengths-list">
                                <span className="guide-model-card-strength">
                                    <Check size={14} /> Data analysis
                                </span>
                                <span className="guide-model-card-strength">
                                    <Check size={14} /> Reports
                                </span>
                                <span className="guide-model-card-strength">
                                    <Check size={14} /> Numbers
                                </span>
                                <span className="guide-model-card-strength">
                                    <Check size={14} /> Complex reasoning
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <GuideTip variant="info">
                    Each model has its specialty, so experiment a bit! Try different models with different 
                    tasks and see what fits your workflow best. You might find GPT perfect for your morning 
                    emails and Claude ideal for your afternoon data crunching.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Switching Models</h2>
                <div className="guide-section-content">
                    <p>
                        You can change your default provider and model in <strong>Settings → Model</strong>. 
                        This sets what Atlas uses for new conversations.
                    </p>
                    <p>
                        For quick switches during a conversation, use the model selector dropdown in the 
                        chat interface. The change takes effect immediately for your next message.
                    </p>
                </div>

                <GuideTip 
                    variant="success" 
                    title="Pro Tip"
                    action={<GuideTryIt to="/settings">Go to Settings</GuideTryIt>}
                >
                    If you mostly work with data and reports, set Anthropic as your default. 
                    You can always switch to OpenAI for specific writing tasks without changing your defaults.
                </GuideTip>
            </section>

            <section className="guide-section">
                <h2 className="guide-section-title">Available Models</h2>
                <div className="guide-section-content">
                    <p>
                        Each provider offers multiple models with different capabilities and speeds. 
                        Generally, larger models are more capable but slower, while smaller models 
                        are faster but may be less thorough.
                    </p>
                    <p>
                        <strong>OpenAI:</strong> GPT-4o is the flagship model—fast and capable for most tasks. 
                        Newer versions become available as OpenAI releases them.
                    </p>
                    <p>
                        <strong>Anthropic:</strong> Claude Sonnet 4.5 offers a great balance of speed and 
                        intelligence. Claude Opus 4.5 is the most capable for complex tasks but takes longer.
                    </p>
                </div>

                <GuideTip variant="warning" title="Note">
                    Some advanced features like extended thinking are only available on certain models. 
                    Check the Model settings to see what options are available for your selected model.
                </GuideTip>
            </section>
        </GuidePage>
    );
};

export default ModelsGuide;
