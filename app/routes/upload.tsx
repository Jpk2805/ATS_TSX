import React, { type FormEvent } from 'react'
import Navbar from '~/components/Navbar'
import { useState } from 'react'
import FileUploader from '~/components/FileUploader';
import { usePuterStore } from '~/lib/puter';
import { useNavigate } from 'react-router';
import { convertPdfToImage } from '~/lib/pdf2img';
import { generateUUID } from '~/lib/utils';
import { prepareInstructions } from '../../constants';


const Upload = () => {
  const {auth, isLoading, fs, ai, kv} = usePuterStore();

  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");

  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({companyName, jobTitle, jobDescription, file}: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);

    setStatusText("Uploading the file...")

    const uploadedFile = await fs.upload([file])

    if(!uploadedFile) return setStatusText("Failed to upload the file.");   

    setStatusText('converting to image...')

    const imageFile = await convertPdfToImage(file);

    if(!imageFile.file) return setStatusText("Failed to convert PDF to image.");

    setStatusText('uploading image...')

    const uploadedImage = await fs.upload([imageFile.file]);
    if(!uploadedImage) return setStatusText("Failed to upload the image.");

    const uuid = generateUUID();

    const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName: companyName,
        jobTitle: jobTitle,
        jobDescription: jobDescription, 
        feedback: ''
    }

    await kv.set(`resume_${uuid}`, JSON.stringify(data));

    setStatusText('analysing....')

    const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({jobTitle, jobDescription})
    );

    if (!feedback) {
      setStatusText("Failed to analyze the resume.");
      return;
    }

    const feedbackText = typeof feedback.message.content === 'string' ? feedback.message.content : feedback.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);

    await kv.set(`resume_${uuid}`, JSON.stringify(data));

    setStatusText("Analysis complete, Redirecting...");

    console.log("Resume data:", data);

    navigate(`/resume/${uuid}`);
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form) return;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;


    if (!file) return ;

    handleAnalyze({
      companyName,
      jobTitle,
      jobDescription,
      file
    });
  }

  return (
    <main className= "bg-[url('/images/bg-main.svg')]">
      <Navbar />
      <section className="main-section">
        <div className = 'page-heading py-16' >
          <h2>Smart Feedback from your dream Job.</h2>
          {isProcessing ? (
            <>
                <h3>{statusText}</h3>
                <img src="/images/resume-scan.gif" className= "w-full" alt="Loading..." />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement suggestions.</h2>
          )}

          {!isProcessing && (
            <form id = 'upload-form' onSubmit= {handleSubmit} className='flex flex-col gap-4 mt-8'>
                <div className='form-div'>
                    <label htmlFor="company-name">Company Name</label>
                    <input type="text" name= "company-name" placeholder='Company Name' id= 'company-name' />
                </div>
                <div className='form-div'>
                    <label htmlFor="job-title">Job Title</label>
                    <input type="text" name= "job-title" placeholder='Job Title' id= 'job-title' />
                </div>
                <div className='form-div'>
                    <label htmlFor="job-description">Job Description</label>
                    <textarea rows= {5}  name= "job-description" placeholder='Job Description' id= 'job-description' />
                </div>
                <div className='form-div'>
                    <label htmlFor="uploader">Upload Resume</label>
                    <FileUploader onFileSelect={handleFileSelect} />
                </div>

                <button type='submit' className='primary-button'>
                    Analysis Resume
                </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

export default Upload