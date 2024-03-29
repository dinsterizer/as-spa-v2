<template>
  <GroupsSeparated>
    <AppLoading v-if="$fetchState.pending" />

    <div v-if="!$fetchState.pending" class="space-y-6">
      <HeadingsBase3> Thêm xác thực </HeadingsBase3>
      <StepsBullets v-model="currentStep" :last-step="2" />

      <!-- Select validator -->
      <div v-if="currentStep === 1" class="space-y-4">
        <HeadingsBase3> Chọn bài xác thực </HeadingsBase3>
        <div class="flex justify-end">
          <InputsSearch
            v-model="search"
            :loading="isSearching"
            class="shadow"
            @model="onSearchChange"
          />
        </div>
        <ul
          v-if="validators && validators.length > 0"
          class="flex-1 flex items-center flex-wrap gap-3"
        >
          <li v-for="validator in validators" :key="'fetched' + validator.id">
            <button @click="selectValidator(validator)">
              <ValidatorsCard :validator="validator" />
            </button>
          </li>
        </ul>

        <span v-else class="flex-1 text-gray-500 tracking-wider text-center">
          Danh sách trống
        </span>

        <PaginationsCenteredNumbers
          v-if="meta.lastPage > 1"
          v-model="meta.currentPage"
          :last-page="meta.lastPage"
          @model="onPageChange"
        />
      </div>

      <div v-if="currentStep === 2" class="space-y-6">
        <Inputs v-model="order" type="number">
          Thứ tự kiểm tra
          <template #description> Càng nhỏ kiểm tra càng sớm </template>
        </Inputs>

        <div class="space-y-4">
          <HeadingsBase3> Ánh sạ các trường xác minh có thể đọc </HeadingsBase3>
          <Selects
            v-for="field in selectedValidator.readableFields"
            :key="'read' + field"
            v-model="mappedReadableFields[field]"
            :options="accountInfos"
            display-key="name"
            value-key="id"
          >
            {{ field }}
          </Selects>
        </div>

        <div class="space-y-2">
          <HeadingsBase3>
            Ánh sạ các trường xác minh có thể cập nhật
          </HeadingsBase3>
          <Selects
            v-for="field in selectedValidator.updatableFields"
            :key="'update' + field"
            v-model="mappedUpdatableFields[field]"
            :options="accountInfos"
            display-key="name"
            value-key="id"
          >
            {{ field }}
          </Selects>
        </div>
      </div>
    </div>

    <template v-if="!$fetchState.pending" #footer>
      <div class="flex items-center gap-3 justify-end">
        <Buttons
          v-if="currentStep === 2"
          color="green"
          loading="completeAddValidatorable"
          @click="addNewValidator(selectedValidator)"
        >
          Thêm
        </Buttons>
      </div>
    </template>
  </GroupsSeparated>
</template>

<script>
import { debounce } from 'lodash'

export default {
  props: {
    accountTypeId: {
      type: Number,
      required: true,
    },
    type: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      currentStep: 1,
      order: undefined,
      validators: [],
      selectedValidator: {},
      search: undefined,
      isSearching: false,
      meta: undefined,
      accountInfos: [],
      mappedReadableFields: {},
      mappedUpdatableFields: {},
    }
  },
  async fetch() {
    const [{ data: validators, meta }, { data: accountType }] =
      await Promise.all([
        this.$axios.$get('validators', {
          params: {
            _perPage: 12,
          },
        }),
        this.$axios.$get(`account-types/${this.accountTypeId}`, {
          params: {
            _relationships: ['accountInfos'],
          },
        }),
      ])

    this.validators = this.toFull(validators)
    this.accountInfos = accountType.accountInfos
    this.meta = meta
  },
  methods: {
    onSearchChange: debounce(async function (search) {
      this.isSearching = true
      const { data: validators, meta } = await this.$axios.$get('validators', {
        params: {
          _perPage: 12,
          _search: search,
        },
      })

      this.validators = this.toFull(validators)
      this.meta = meta
      this.isSearching = false
    }, 500),
    onPageChange: debounce(async function (page) {
      const { data: validators, meta } = await this.$axios.$get('validators', {
        params: {
          _perPage: 12,
          page,
        },
      })

      this.validators = this.toFull(validators)
      this.meta = meta
    }, 200),
    selectValidator(validator) {
      this.selectedValidator = validator
      this.currentStep = 2
    },
    toFull(validators) {
      return validators.map((v) => ({
        ...v,
        pivot: {
          mappedReadableFields: {},
          mappedUpdatableFields: {},
        },
      }))
    },
    async addNewValidator(validator) {
      if (
        Object.keys(this.mappedReadableFields).length <
          validator.readableFields.length ||
        Object.keys(this.mappedUpdatableFields).length <
          validator.updatableFields.length
      ) {
        this.$notification.error('Vui lòng kiểm tra lại thông tin')
        this.$nuxt.$emit('completeAddValidatorable')
        return
      }

      const { status, data } = await this.$axios.post(
        `account-types/${this.accountTypeId}/validatorables/${this.selectedValidator.id}`,
        {
          type: this.type,
          order: this.order,
          mappedReadableFields: this.mappedReadableFields,
          mappedUpdatableFields: this.mappedUpdatableFields,
        }
      )
      this.$nuxt.$emit('completeAddValidatorable')

      if (status < 300) {
        this.$notification.success('Thêm thành công')
        this.$emit('created', data.data)
      }
    },
  },
}
</script>
