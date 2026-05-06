import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '../contacts/contact.service';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask implements OnInit {

  contactService = inject(Supabase);
  contacts = this.contactService.contacts;

  taskForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', Validators.required],
      priority: ['Medium'],
      assignedTo: [null],
      category: ['', Validators.required],
      subtasks: ['']
    });
  }

  ngOnInit() {
    this.contactService.getContacts();
  }

  setPriority(value: string) {
    this.taskForm.patchValue({ priority: value });
  }

  submit() {
    if (this.taskForm.valid) {
      console.log(this.taskForm.value);
    } else {
      this.taskForm.markAllAsTouched();
    }
  }

  clear() {
    this.taskForm.reset({
      priority: 'Medium'
    });
  }

}
