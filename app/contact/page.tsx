'use client';

import PageTitle from '@/components/PageTitle';
import { contactFormSchema } from '@/utils/zodSchemas';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Flex,
  Text,
  TextInput,
  Textarea,
  Typography,
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type ContactFormData = z.infer<typeof contactFormSchema>;

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitStatus('success');
        reset();
      } else {
        const errorData = await response.json();
        console.error('Contact form error:', errorData);
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Typography>
      <PageTitle>Contact</PageTitle>

      <Text>
        Feel free to reach out if you want to talk code, ideas, or anything in
        between.
      </Text>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {submitStatus === 'success' && (
          <Alert
            variant="light"
            color="green"
            title="Thank you!"
            icon={<IconCheck />}
          >
            Thank you for your message! I'll get back to you soon.
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert
            variant="light"
            color="red"
            title="Error"
            icon={<IconAlertCircle />}
          >
            Sorry, there was an error sending your message. Please try again.
          </Alert>
        )}
        <TextInput
          label="Name *"
          id="name"
          {...register('name')}
          placeholder="Your name"
          error={Boolean(errors.name?.message)}
        />

        <TextInput
          label="Email *"
          type="email"
          id="email"
          {...register('email')}
          placeholder="your.email@example.com"
          error={Boolean(errors.email?.message)}
        />

        <TextInput
          label="Subject *"
          id="subject"
          {...register('subject')}
          placeholder="What is this about?"
          error={Boolean(errors.subject?.message)}
        />

        <Textarea
          label="Message *"
          id="message"
          rows={6}
          {...register('message')}
          placeholder="You are awesome! Let's be friends 🍺"
          error={Boolean(errors.message?.message)}
        />

        <Flex justify="flex-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </Flex>
      </form>
    </Typography>
  );
};

export default ContactPage;
